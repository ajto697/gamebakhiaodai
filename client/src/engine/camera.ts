/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * HỆ THỐNG CAMERA BÁM NHÂN VẬT, HIT-STOP & RUNG MÀN HÌNH (CAMERA & GAME FEEL)
 * - Camera bám theo vị trí nhân vật với giới hạn biên màn chơi (Level Bounds).
 * - Cơ chế Hit-Stop (đóng băng 3-5 khung khi ra đòn trúng mạnh tạo cảm giác lực).
 * - Rung màn hình nhẹ (Screen Shake) suy giảm theo thời gian.
 */

export class GameCamera {
  public x = 0;
  public y = 0;
  public targetX = 0;
  public targetY = 0;

  // Giới hạn biên màn chơi (World bounds)
  public minX = 0;
  public maxX = 1200; // Độ dài màn chạy cuộn ngang
  public minY = 0;
  public maxY = 270;

  // Kích thước Viewport
  public viewportWidth = 480;
  public viewportHeight = 270;

  // Hiệu ứng Rung màn hình (Screen Shake)
  public shakeIntensity = 0;
  public shakeDuration = 0;
  public shakeOffsetX = 0;
  public shakeOffsetY = 0;

  // Cơ chế Hit-Stop (Khung hình đóng băng tạo lực đòn đánh)
  public hitStopFrames = 0;

  constructor(viewportWidth = 480, viewportHeight = 270) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  /**
   * Kích hoạt rung màn hình nhẹ
   * @param intensity Cường độ rung (pixel)
   * @param duration Số frame rung (mặc định 8-12 frame)
   */
  public triggerShake(intensity = 3, duration = 10): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  /**
   * Kích hoạt Hit-Stop (đóng băng thế giới trong 3 - 5 frame khi đánh trúng)
   */
  public triggerHitStop(frames = 4): void {
    this.hitStopFrames = frames;
  }

  /**
   * Kiểm tra xem vòng lặp hiện tại có đang trong trạng thái Hit-Stop hay không
   */
  public isInHitStop(): boolean {
    if (this.hitStopFrames > 0) {
      this.hitStopFrames--;
      return true;
    }
    return false;
  }

  /**
   * Cập nhật vị trí camera bám theo nhân vật mục tiêu
   */
  public update(targetPlayerX: number, _targetPlayerY: number): void {
    // Camera bám theo nhân vật (giữ nhân vật ở khoảng 1/3 - 1/2 khung hình bên trái)
    const desiredX = targetPlayerX - this.viewportWidth * 0.38;

    // Smooth lerp 0.1
    this.x += (desiredX - this.x) * 0.12;

    // Giới hạn trong biên thế giới
    this.x = Math.max(this.minX, Math.min(this.maxX - this.viewportWidth, this.x));
    this.y = 0; // Game cuộn ngang 2D, camera Y cố định hoặc trôi nhẹ

    // Xử lý rung màn hình
    if (this.shakeDuration > 0) {
      this.shakeOffsetX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.shakeDuration--;
      this.shakeIntensity *= 0.88;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  /**
   * Áp dụng biến đổi camera lên Canvas Context
   */
  public applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const renderX = Math.round(-this.x + this.shakeOffsetX);
    const renderY = Math.round(-this.y + this.shakeOffsetY);
    ctx.translate(renderX, renderY);
  }

  public restoreTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }
}
