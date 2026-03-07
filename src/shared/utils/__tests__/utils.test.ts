/** @fileoverview Unit tests for shared utility functions. */
import { describe, it, expect } from 'vitest'
import {
    bytesToSize,
    calcProgress,
    calcRatio,
    getFileName,
    getFileExtension,
    ellipsis,
    splitTextRows,
    convertCommaToLine,
    convertLineToComma,
    getTaskName,
    isMagnetTask,
    checkTaskIsBT,
    checkTaskIsSeeder,
    decodeThunderLink,
    detectResource,
    isTorrent,
    isRTL,
    getLangDirection,
    getFileSelection,
    getFileNameFromFile,
} from '@shared/utils'
import type { Aria2Task, Aria2File } from '@shared/types'

function createMockTask(overrides: Partial<Aria2Task> = {}): Aria2Task {
    return {
        gid: '1',
        status: 'active',
        totalLength: '1000',
        completedLength: '500',
        uploadLength: '0',
        downloadSpeed: '100',
        uploadSpeed: '0',
        connections: '1',
        dir: '/tmp',
        files: [],
        ...overrides,
    }
}

function createMockFile(overrides: Partial<Aria2File> = {}): Aria2File {
    return {
        index: '1',
        path: '/tmp/test.txt',
        length: '1000',
        completedLength: '500',
        selected: 'true',
        uris: [],
        ...overrides,
    }
}

describe('bytesToSize', () => {
    it('returns 0 KB for zero bytes', () => {
        expect(bytesToSize(0)).toBe('0 KB')
        expect(bytesToSize('0')).toBe('0 KB')
    })

    it('formats bytes correctly', () => {
        expect(bytesToSize(1024)).toBe('1.0 KB')
        expect(bytesToSize(1048576)).toBe('1.0 MB')
        expect(bytesToSize(1073741824)).toBe('1.0 GB')
    })

    it('respects precision parameter', () => {
        expect(bytesToSize(1536, 2)).toBe('1.50 KB')
    })

    it('handles string input', () => {
        expect(bytesToSize('2048')).toBe('2.0 KB')
    })

    it('formats small values as B', () => {
        expect(bytesToSize(100)).toBe('100 B')
    })
})

describe('calcProgress', () => {
    it('returns 0 for zero total length', () => {
        expect(calcProgress(0, 0)).toBe(0)
    })

    it('calculates percentage correctly', () => {
        expect(calcProgress(1000, 500)).toBe(50)
        expect(calcProgress(1000, 1000)).toBe(100)
        expect(calcProgress(1000, 250)).toBe(25)
    })

    it('respects decimal parameter', () => {
        expect(calcProgress(3, 1, 1)).toBeCloseTo(33.3, 1)
    })

    it('handles string inputs', () => {
        expect(calcProgress('1000', '500')).toBe(50)
    })
})

describe('calcRatio', () => {
    it('returns 0 for zero total length', () => {
        expect(calcRatio(0, 0)).toBe(0)
    })

    it('calculates ratio correctly', () => {
        expect(calcRatio(1000, 500)).toBe(0.5)
        expect(calcRatio(1000, 1000)).toBe(1)
    })
})

describe('getFileName', () => {
    it('extracts filename from path', () => {
        expect(getFileName('/path/to/file.txt')).toBe('file.txt')
    })

    it('returns the full string if no separator', () => {
        expect(getFileName('file.txt')).toBe('file.txt')
    })
})

describe('getFileExtension', () => {
    it('extracts extension', () => {
        expect(getFileExtension('file.txt')).toBe('txt')
        expect(getFileExtension('archive.tar.gz')).toBe('gz')
    })
})

describe('ellipsis', () => {
    it('returns empty string for falsy input', () => {
        expect(ellipsis('')).toBe('')
    })

    it('truncates long strings', () => {
        const long = 'a'.repeat(100)
        expect(ellipsis(long, 10)).toBe('a'.repeat(10) + '...')
    })

    it('returns original string when shorter than max', () => {
        expect(ellipsis('short', 64)).toBe('short')
    })
})

describe('splitTextRows', () => {
    it('splits text by newlines and trims', () => {
        const result = splitTextRows('a\nb\nc')
        expect(result).toEqual(['a', 'b', 'c'])
    })
})

describe('convertCommaToLine / convertLineToComma', () => {
    it('converts commas to newlines', () => {
        expect(convertCommaToLine('a,b,c')).toBe('a\nb\nc')
    })

    it('converts newlines to commas', () => {
        expect(convertLineToComma('a\nb\nc')).toBe('a,b,c')
    })
})

describe('getTaskName', () => {
    it('returns default name for null task', () => {
        expect(getTaskName(null, { defaultName: 'Unknown' })).toBe('Unknown')
    })

    it('returns BT info name when available', () => {
        const task = createMockTask({
            files: [createMockFile()],
            bittorrent: { info: { name: 'My Torrent' } },
        })
        expect(getTaskName(task)).toBe('My Torrent')
    })

    it('returns filename for single-file HTTP task', () => {
        const task = createMockTask({
            files: [createMockFile({ path: '/downloads/movie.mp4' })],
        })
        expect(getTaskName(task)).toBe('movie.mp4')
    })
})

describe('isMagnetTask', () => {
    it('returns true for magnet task without info', () => {
        const task = createMockTask({ bittorrent: {} })
        expect(isMagnetTask(task)).toBe(true)
    })

    it('returns false for regular BT task', () => {
        const task = createMockTask({ bittorrent: { info: { name: 'test' } } })
        expect(isMagnetTask(task)).toBe(false)
    })

    it('returns false for HTTP task', () => {
        const task = createMockTask()
        expect(isMagnetTask(task)).toBe(false)
    })
})

describe('checkTaskIsBT', () => {
    it('returns true when bittorrent metadata is present', () => {
        const task = createMockTask({ bittorrent: { info: { name: 'test' } } })
        expect(checkTaskIsBT(task)).toBe(true)
    })

    it('returns false when no bittorrent metadata', () => {
        expect(checkTaskIsBT(createMockTask())).toBe(false)
    })

    it('returns false for empty object', () => {
        expect(checkTaskIsBT()).toBe(false)
    })
})

describe('checkTaskIsSeeder', () => {
    it('returns true when BT task has seeder=true', () => {
        const task = createMockTask({
            bittorrent: { info: { name: 'test' } },
            seeder: 'true',
        })
        expect(checkTaskIsSeeder(task)).toBe(true)
    })

    it('returns false for non-BT task', () => {
        expect(checkTaskIsSeeder(createMockTask())).toBe(false)
    })
})

describe('decodeThunderLink', () => {
    it('returns non-thunder links unchanged', () => {
        expect(decodeThunderLink('https://example.com')).toBe('https://example.com')
    })
})

describe('detectResource', () => {
    it('detects HTTP resource', () => {
        expect(detectResource('https://example.com/file.zip')).toBe(true)
    })

    it('detects magnet link', () => {
        expect(detectResource('magnet:?xt=urn:btih:abc')).toBe(true)
    })

    it('returns false for plain text', () => {
        expect(detectResource('hello world')).toBe(false)
    })
})

describe('isTorrent', () => {
    it('detects .torrent extension', () => {
        expect(isTorrent({ name: 'file.torrent', type: '' })).toBe(true)
    })

    it('detects torrent MIME type', () => {
        expect(isTorrent({ name: 'file', type: 'application/x-bittorrent' })).toBe(true)
    })

    it('returns false for non-torrent', () => {
        expect(isTorrent({ name: 'file.txt', type: 'text/plain' })).toBe(false)
    })
})

describe('isRTL / getLangDirection', () => {
    it('correctly identifies RTL locales', () => {
        expect(isRTL('ar')).toBe(true)
        expect(isRTL('en-US')).toBe(false)
    })

    it('returns correct direction', () => {
        expect(getLangDirection('ar')).toBe('rtl')
        expect(getLangDirection('en-US')).toBe('ltr')
    })
})

describe('getFileSelection', () => {
    it('returns all-selected marker when all files selected', () => {
        const files = [
            createMockFile({ selected: 'true' }),
            createMockFile({ index: '2', selected: 'true' }),
        ]
        expect(getFileSelection(files)).not.toBe('')
    })

    it('returns comma-separated indices for partial selection', () => {
        const files = [
            createMockFile({ selected: 'true' }),
            createMockFile({ index: '2', selected: 'false' }),
        ]
        const result = getFileSelection(files)
        expect(result).toContain(',')
    })
})

describe('getFileNameFromFile', () => {
    it('returns filename from path', () => {
        const file = createMockFile({ path: '/tmp/download/test.zip' })
        expect(getFileNameFromFile(file)).toBe('test.zip')
    })

    it('returns empty string for undefined file', () => {
        expect(getFileNameFromFile()).toBe('')
    })

    it('falls back to first URI when path is empty', () => {
        const file = createMockFile({
            path: '',
            uris: [{ uri: 'https://example.com/file.zip', status: 'used' }],
        })
        expect(getFileNameFromFile(file)).toBe('file.zip')
    })
})
