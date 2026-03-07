<script setup lang="ts">
import { computed, watch, onMounted, onBeforeUnmount, ref, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTaskStore } from '@/stores/task'
import { useAppStore } from '@/stores/app'
import { usePreferenceStore } from '@/stores/preference'
import { getTaskUri, getTaskName } from '@shared/utils'
import { remove, stat } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import aria2Api, { isEngineReady } from '@/api/aria2'
import { useDialog, NCheckbox } from 'naive-ui'
import { useAppMessage } from '@/composables/useAppMessage'
import TaskList from '@/components/task/TaskList.vue'
import TaskActions from '@/components/task/TaskActions.vue'
import TaskDetail from '@/components/task/TaskDetail.vue'

const props = withDefaults(defineProps<{ status?: string }>(), { status: 'active' })

const { t } = useI18n()
const taskStore = useTaskStore()
const appStore = useAppStore()
const preferenceStore = usePreferenceStore()
const dialog = useDialog()
const message = useAppMessage()

const subnavs = computed(() => [
  { key: 'active', title: t('task.active') || 'Active' },
  { key: 'stopped', title: t('task.stopped') || 'Completed' },
])

const title = computed(() => {
  const sub = subnavs.value.find((s) => s.key === props.status)
  return sub?.title ?? props.status
})

let refreshTimer: ReturnType<typeof setTimeout> | null = null

function startPolling() {
  stopPolling()
  function tick() {
    if (isEngineReady()) {
      taskStore.fetchList().catch(() => {})
    }
    refreshTimer = setTimeout(tick, appStore.interval)
  }
  refreshTimer = setTimeout(tick, appStore.interval)
}

function stopPolling() {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
}

async function changeCurrentList() {
  stopPolling()
  await taskStore.changeCurrentList(props.status)
  startPolling()
}

watch(() => props.status, changeCurrentList)
onMounted(changeCurrentList)
onBeforeUnmount(stopPolling)

async function deleteTaskFiles(task: Record<string, unknown>) {
  const dir = task.dir as string
  const files = (task.files || []) as { path: string }[]
  const parentDirs = new Set<string>()

  for (const f of files) {
    if (!f.path) continue
    try { await remove(f.path) } catch {}
    try { await remove(f.path + '.aria2') } catch {}
    const lastSep = Math.max(f.path.lastIndexOf('/'), f.path.lastIndexOf('\\'))
    if (lastSep > 0) {
      const parent = f.path.substring(0, lastSep)
      if (parent !== dir) parentDirs.add(parent)
    }
  }

  for (const pd of parentDirs) {
    try { await remove(pd, { recursive: true }) } catch {}
  }

  if (dir) {
    const taskName = getTaskName(task as never, { defaultName: '', maxLen: -1 })
    if (taskName) {
      const taskDir = await join(dir, taskName)
      try { await remove(taskDir, { recursive: true }) } catch {}
    }
  }
}
function handlePauseTask(task: Record<string, unknown>) {
  taskStore.pauseTask(task as never).catch(console.error)
}
function handleResumeTask(task: Record<string, unknown>) {
  taskStore.resumeTask(task as never).catch(console.error)
}
function handleDeleteTask(task: Record<string, unknown>) {
  const noConfirm = preferenceStore.config?.noConfirmBeforeDeleteTask
  if (noConfirm) {
    taskStore.removeTask(task as never).catch(console.error)
    return
  }
  const deleteFiles = ref(false)
  const name = getTaskName(task as never, { defaultName: 'Unknown', maxLen: 50 })
  const d = dialog.warning({
    title: t('task.delete-task'),
    content: () => h('div', {}, [
      h('p', { style: 'margin: 0 0 12px; word-break: break-all;' }, name),
      h(NCheckbox, {
        checked: deleteFiles.value,
        'onUpdate:checked': (v: boolean) => { deleteFiles.value = v },
      }, { default: () => t('task.delete-task-label') }),
    ]),
    positiveText: t('app.yes'),
    negativeText: t('app.no'),
    onPositiveClick: async () => {
      d.loading = true
      d.negativeButtonProps = { disabled: true } as never
      d.closable = false
      d.maskClosable = false
      // Yield to browser so the loading spinner renders before heavy IPC work
      await new Promise(r => setTimeout(r, 50))
      try {
        await taskStore.removeTask(task as never)
        if (deleteFiles.value) {
          await deleteTaskFiles(task)
        }
      } catch (e) {
        console.error('Delete failed:', e)
      }
    },
  })
}
function handleDeleteRecord(task: Record<string, unknown>) {
  taskStore.removeTaskRecord(task as never).catch(console.error)
}
function handleCopyLink(task: Record<string, unknown>) {
  navigator.clipboard.writeText(getTaskUri(task as never))
}
function handleShowInfo(task: Record<string, unknown>) {
  taskStore.showTaskDetail(task as never)
}
async function handleShowInFolder(task: Record<string, unknown>) {
  const files = (task.files || []) as { path: string }[]
  const filePath = files[0]?.path
  if (!filePath) return
  try {
    await revealItemInDir(filePath)
  } catch {
    message.warning(t('task.file-not-exist'))
  }
}
function handleStopSeeding(task: Record<string, unknown>) {
  taskStore.removeTask(task as never).catch(console.error)
}
</script>

<template>
  <div class="task-view">
    <header class="panel-header" data-tauri-drag-region>
      <h4 class="task-title" :key="status">{{ title }}</h4>
      <TaskActions />
    </header>
    <div class="panel-content">
      <TaskList
        :key="props.status"
        @pause="handlePauseTask"
        @resume="handleResumeTask"
        @delete="handleDeleteTask"
        @delete-record="handleDeleteRecord"
        @copy-link="handleCopyLink"
        @show-info="handleShowInfo"
        @folder="handleShowInFolder"
        @stop-seeding="handleStopSeeding"
      />
    </div>
    <TaskDetail
      :show="taskStore.taskDetailVisible"
      :task="taskStore.currentTaskItem"
      :files="taskStore.currentTaskFiles"
      @close="taskStore.hideTaskDetail()"
    />
  </div>
</template>

<style scoped>
.task-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.panel-header {
  position: relative;
  padding: 46px 0 12px;
  margin: 0 36px;
  border-bottom: 2px solid var(--panel-border);
  user-select: none;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}
.task-title {
  margin: 0;
  color: var(--panel-title);
  font-size: 16px;
  font-weight: normal;
  line-height: 24px;
}
.panel-content {
  position: relative;
  padding: 0;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
</style>
