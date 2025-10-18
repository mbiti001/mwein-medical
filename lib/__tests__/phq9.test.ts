import { describe, expect, it } from 'vitest'

import { interpretPhq9, scorePhq9 } from '../phq9'

describe('PHQ-9 scoring', () => {
	it('calculates the correct total score', () => {
		expect(scorePhq9([0, 1, 2, 3])).toBe(6)
		expect(scorePhq9(Array(9).fill(3))).toBe(27)
		expect(scorePhq9(Array(9).fill(0))).toBe(0)
	})

	it('maps scores to WHO-aligned severity ranges', () => {
		expect(interpretPhq9(0).severity).toBe('minimal')
		expect(interpretPhq9(4).severity).toBe('minimal')
		expect(interpretPhq9(5).severity).toBe('mild')
		expect(interpretPhq9(9).severity).toBe('mild')
		expect(interpretPhq9(10).severity).toBe('moderate')
		expect(interpretPhq9(14).severity).toBe('moderate')
		expect(interpretPhq9(15).severity).toBe('moderately-severe')
		expect(interpretPhq9(19).severity).toBe('moderately-severe')
		expect(interpretPhq9(20).severity).toBe('severe')
		expect(interpretPhq9(27).severity).toBe('severe')
	})

	it('flags positive screens at 10 and above', () => {
		expect(interpretPhq9(9).isPositiveScreen).toBe(false)
		expect(interpretPhq9(10).isPositiveScreen).toBe(true)
	})
})
