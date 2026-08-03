import { describe, it, expect } from "vitest"
import { getMealRate, getMemberSummary } from "./calculations"

describe("calculations", () => {
  describe("getMealRate", () => {
    it("should calculate correct rate for standard inputs", () => {
      const rate = getMealRate(1000, 20)
      expect(rate).toBe(50)
    })

    it("should handle zero total meals to avoid divide-by-zero", () => {
      const rate = getMealRate(1000, 0)
      expect(rate).toBe(0)
    })

    it("should handle floating point results correctly", () => {
      const rate = getMealRate(100, 3)
      expect(rate).toBeCloseTo(33.333, 3)
    })
    
    it("should return zero when expense is zero", () => {
      const rate = getMealRate(0, 100)
      expect(rate).toBe(0)
    })
  })

  describe("getMemberSummary", () => {
    it("should calculate cost and due correctly for standard inputs", () => {
      // 10 meals * 50 rate = 500 cost. 200 deposited => due = 300
      const result = getMemberSummary(10, 50, 200)
      expect(result.memberCost).toBe(500)
      expect(result.memberDue).toBe(300)
    })

    it("should calculate advance (negative due) when deposit > cost", () => {
      // 10 meals * 50 rate = 500 cost. 600 deposited => due = -100 (advance)
      const result = getMemberSummary(10, 50, 600)
      expect(result.memberCost).toBe(500)
      expect(result.memberDue).toBe(-100)
    })

    it("should handle zero meals and zero deposits", () => {
      const result = getMemberSummary(0, 50, 0)
      expect(result.memberCost).toBe(0)
      expect(result.memberDue).toBe(0)
    })
    
    it("should handle zero meals with deposits (pure advance)", () => {
      const result = getMemberSummary(0, 50, 500)
      expect(result.memberCost).toBe(0)
      expect(result.memberDue).toBe(-500)
    })
  })
})
