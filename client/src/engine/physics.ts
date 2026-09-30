/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * HỆ THỐNG VẬT LÝ 2D & VA CHẠM AABB (PHYSICS & AABB COLLISION)
 * Cung cấp:
 * - Thuật toán va chạm hình hộp trục song song (Axis-Aligned Bounding Box - AABB).
 * - Trọng lực, ma sát, kiểm tra đứng trên bệ (Platform ground checks).
 * - Fixed Timestep 60Hz accumulator.
 */

export interface RectAABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function checkAABB(a: RectAABB, b: RectAABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export class PhysicsEngine {
  public static GRAVITY = 0.45;
  public static GROUND_Y = 200; // Độ cao mặt đất đi bộ chuẩn của màn chơi
  public static FIXED_TIMESTEP = 1000 / 60; // 16.666ms (60Hz)

  public platforms: Platform[] = [];

  constructor() {
    // Khởi tạo các bệ gạch nhảy ban đầu trong màn chạy
    this.platforms = [
      { x: 260, y: 165, width: 80, height: 10 },
      { x: 420, y: 140, width: 90, height: 10 },
      { x: 620, y: 160, width: 85, height: 10 },
      { x: 800, y: 135, width: 100, height: 10 },
    ];
  }

  /**
   * Kiểm tra va chạm với mặt đất và các bệ platform
   * @param x Tọa độ X chân nhân vật
   * @param y Tọa độ Y chân nhân vật
   * @param prevY Tọa độ Y ở frame trước
   * @returns Độ cao Y mặt tiếp xúc nếu đang đứng trên sàn/bệ, hoặc null
   */
  public checkGroundCollision(x: number, y: number, prevY: number): number | null {
    // 1. Kiểm tra mặt đất chính
    if (y >= PhysicsEngine.GROUND_Y) {
      return PhysicsEngine.GROUND_Y;
    }

    // 2. Kiểm tra các bệ nhảy (chỉ va chạm một chiều từ trên rơi xuống - One-way platform)
    for (const p of this.platforms) {
      if (x >= p.x && x <= p.x + p.width) {
        if (prevY <= p.y + 2 && y >= p.y - 1) {
          return p.y;
        }
      }
    }

    return null;
  }
}
