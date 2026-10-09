/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * HỆ THỐNG CAMERA BÁM NHÂN VẬT, HIT-STOP & RUNG MÀN HÌNH (CAMERA & GAME FEEL)
 * - Camera bám theo vị trí nhân vật với giới hạn biên màn chơi (Level Bounds).
 * - Cơ chế Hit-Stop (đóng băng 3-5 khung khi ra đòn trúng mạnh tạo cảm giác lực).
 * - Rung màn hình nhẹ (Screen Shake) suy giảm theo thời gian.
 */

import { AccessibilityManager } from './accessibility.ts';

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
  public shakeDirX = 0;
  public shakeDirY = 0;

  // Cơ chế Hit-Stop (Khung hình đóng băng tạo lực đòn đánh)
  public hitStopFrames = 0;

  // Hiệu ứng Chớp sáng va chạm (Impact Flash)
  public impactFlashAlpha = 0;
  private lastFlashFrame = -100;
  private frameCount = 0;

  // Hiệu ứng Zoom Camera (Intro Boss / Cận cảnh)
  public zoom = 1.0;
  public targetZoom = 1.0;
  public zoomCenterX = 240;
  public zoomCenterY = 135;

  // Chiêu đặc biệt: Làm tối nền 10 khung, tập trung vào nhân vật rồi bùng sáng (Yêu cầu 2)
  public specialFocusTimer = 0;
  public specialFocusX = 240;
  public specialFocusY = 135;

  // Chậm hình 0.5s khi hạ Boss (Yêu cầu 5)
  public slowMotionFrames = 0;

  constructor(viewportWidth = 480, viewportHeight = 270) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.zoomCenterX = viewportWidth / 2;
    this.zoomCenterY = viewportHeight / 2;
  }

  /**
   * Kích hoạt Zoom camera mượt mà
   */
  public triggerZoom(zoom = 1.12, durationFrames = 60, centerX = 240, centerY = 135): void {
    const a11y = AccessibilityManager.getInstance();
    if (a11y.settings.reduceMotion) return;
    this.targetZoom = zoom;
    this.zoomCenterX = centerX;
    this.zoomCenterY = centerY;
  }

  public resetZoom(): void {
    this.targetZoom = 1.0;
  }

  /**
   * Kích hoạt chiêu đặc biệt làm tối nền 10 khung hình
   */
  public triggerSpecialFocus(x: number, y: number): void {
    this.specialFocusTimer = 10;
    this.specialFocusX = x;
    this.specialFocusY = y;
  }

  /**
   * Kích hoạt chậm hình (Slow-motion 0.5 giây khi hạ Boss)
   */
  public triggerSlowMotion(frames = 30): void {
    this.slowMotionFrames = frames;
  }

  /**
   * Kích hoạt rung màn hình khi đánh trúng địch hoặc nhận đòn
   * @param intensity Cường độ rung (pixel, biên độ nhỏ 2-3px)
   * @param duration Số frame rung (mặc định 6-10 frame, tắt dần nhanh)
   */
  public triggerShake(intensity = 2.5, duration = 8): void {
    const a11y = AccessibilityManager.getInstance();
    if (a11y.settings.reduceMotion) {
      this.shakeIntensity = 0;
      this.shakeDuration = 0;
      return;
    }
    this.shakeIntensity = Math.min(4.5, Math.max(this.shakeIntensity, intensity));
    this.shakeDuration = Math.max(this.shakeDuration, duration);
    this.shakeDirX = (Math.random() - 0.5) * 2;
    this.shakeDirY = (Math.random() - 0.5) * 2;
  }

  /**
   * Rung màn hình theo hướng lực đánh (Directional Shake)
   * @param dirX Hướng X (-1 hoặc 1)
   * @param dirY Hướng Y (-1, 0 hoặc 1)
   * @param intensity Cường độ rung (biên độ nhỏ 2-3px)
   * @param duration Thời lượng khung hình
   */
  public triggerDirectionalShake(dirX = 1, dirY = 0, intensity = 2.8, duration = 7): void {
    const a11y = AccessibilityManager.getInstance();
    if (a11y.settings.reduceMotion) {
      this.shakeIntensity = 0;
      this.shakeDuration = 0;
      return;
    }
    const len = Math.hypot(dirX, dirY) || 1;
    this.shakeDirX = dirX / len;
    this.shakeDirY = dirY / len;
    this.shakeIntensity = Math.min(4.0, Math.max(this.shakeIntensity, intensity));
    this.shakeDuration = Math.max(this.shakeDuration, duration);
  }

  /**
   * Kích hoạt Hit-Stop (đóng băng thế giới trong 3 - 5 frame khi đánh trúng)
   */
  public triggerHitStop(frames = 4): void {
    this.hitStopFrames = Math.max(this.hitStopFrames, Math.min(5, frames));
  }

  /**
   * Kích hoạt Chớp sáng màn hình tức thời (Impact Flash)
   * An toàn: tắt hoàn toàn khi "Giảm hiệu ứng", cường độ êm dịu <= 0.28,
   * TUYỆT ĐỐI không chớp quá 3 lần/giây (tối thiểu 20 frames giữa các lần chớp)
   */
  public triggerImpactFlash(alpha = 0.22): void {
    const a11y = AccessibilityManager.getInstance();
    if (a11y.settings.reduceMotion) {
      this.impactFlashAlpha = 0;
      return;
    }
    // Giới hạn an toàn ánh sáng: không chớp quá 3 lần/giây (tối thiểu 20 frames giữa các lần chớp)
    if (this.frameCount - this.lastFlashFrame < 20) {
      return;
    }
    this.lastFlashFrame = this.frameCount;
    this.impactFlashAlpha = Math.min(0.28, Math.max(this.impactFlashAlpha, alpha));
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
   * Cập nhật vị trí camera bám theo nhân vật mục tiêu và tính toán rung màn hình
   * @param inHitStop true nếu đang trong khung hình đóng băng hit-stop (bảo tồn thời lượng rung)
   */
  public update(targetPlayerX: number, _targetPlayerY: number, inHitStop = false): void {
    this.frameCount++;
    if (!inHitStop) {
      // Camera bám theo nhân vật (giữ nhân vật ở khoảng 1/3 - 1/2 khung hình bên trái)
      const desiredX = targetPlayerX - this.viewportWidth * 0.38;

      // Smooth lerp 0.12
      this.x += (desiredX - this.x) * 0.12;

      // Giới hạn trong biên thế giới
      this.x = Math.max(this.minX, Math.min(this.maxX - this.viewportWidth, this.x));
      this.y = 0; // Game cuộn ngang 2D, camera Y cố định hoặc trôi nhẹ
    }

    // Xử lý rung màn hình có độ nảy sắc nét theo hướng đánh (Directional trauma shake)
    if (this.shakeDuration > 0 || (inHitStop && this.shakeIntensity > 0)) {
      if (Math.abs(this.shakeDirX) > 0.01 || Math.abs(this.shakeDirY) > 0.01) {
        const sign = this.shakeDuration % 2 === 0 ? 1 : -0.65;
        const perpX = -this.shakeDirY * (Math.random() - 0.5) * 0.4;
        const perpY = this.shakeDirX * (Math.random() - 0.5) * 0.4;
        this.shakeOffsetX = (this.shakeDirX * sign + perpX) * this.shakeIntensity;
        this.shakeOffsetY = (this.shakeDirY * sign + perpY) * this.shakeIntensity * 0.75;
      } else {
        const angle = Math.random() * Math.PI * 2;
        this.shakeOffsetX = Math.cos(angle) * this.shakeIntensity;
        this.shakeOffsetY = Math.sin(angle) * this.shakeIntensity * 0.75;
      }

      if (!inHitStop) {
        this.shakeDuration--;
        this.shakeIntensity *= 0.82;
        if (this.shakeIntensity < 0.2) {
          this.shakeIntensity = 0;
          this.shakeDirX = 0;
          this.shakeDirY = 0;
        }
      }
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    // Cập nhật Zoom mượt mà
    if (Math.abs(this.targetZoom - this.zoom) > 0.005) {
      this.zoom += (this.targetZoom - this.zoom) * 0.1;
    } else {
      this.zoom = this.targetZoom;
    }

    // Đếm lùi chiêu đặc biệt làm tối nền 10 khung
    if (this.specialFocusTimer > 0) {
      this.specialFocusTimer--;
      if (this.specialFocusTimer === 0) {
        // Hết 10 khung -> bùng sáng
        const a11y = AccessibilityManager.getInstance();
        if (!a11y.settings.reduceMotion) {
          this.triggerImpactFlash(0.24);
        }
      }
    }

    // Đếm lùi chậm hình
    if (this.slowMotionFrames > 0) {
      this.slowMotionFrames--;
    }

    // Giảm dần chớp sáng va chạm (trong hit-stop giữ chớp sáng rõ nét hơn)
    if (this.impactFlashAlpha > 0) {
      if (!inHitStop) {
        this.impactFlashAlpha *= 0.72;
        if (this.impactFlashAlpha < 0.02) {
          this.impactFlashAlpha = 0;
        }
      }
    }
  }

  /**
   * Áp dụng biến đổi camera lên Canvas Context
   */
  public applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    if (this.zoom !== 1.0) {
      ctx.translate(this.zoomCenterX, this.zoomCenterY);
      ctx.scale(this.zoom, this.zoom);
      ctx.translate(-this.zoomCenterX, -this.zoomCenterY);
    }
    const renderX = Math.round(-this.x + this.shakeOffsetX);
    const renderY = Math.round(-this.y + this.shakeOffsetY);
    ctx.translate(renderX, renderY);
  }

  public restoreTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  /**
   * Chiêu đặc biệt: Làm tối nền 10 khung, tập trung vào nhân vật, rồi bùng sáng (Yêu cầu 2)
   */
  public drawSpecialFocus(ctx: CanvasRenderingContext2D): void {
    if (this.specialFocusTimer > 0) {
      const a11y = AccessibilityManager.getInstance();
      const alpha = a11y.settings.reduceMotion ? 0.35 : 0.72;
      const screenX = Math.round(this.specialFocusX - this.x);
      const screenY = Math.round(this.specialFocusY);

      ctx.save();
      // Vẽ bóng tối bao phủ
      ctx.fillStyle = `rgba(15, 13, 27, ${alpha})`;
      ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

      // Khoét vòng tròn hào quang tập trung vào nhân vật
      const radius = 42;
      const grad = ctx.createRadialGradient(screenX, screenY, 10, screenX, screenY, radius);
      grad.addColorStop(0, 'rgba(254, 219, 91, 0.45)');
      grad.addColorStop(0.5, 'rgba(119, 224, 181, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Vẽ vòng sáng viền
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#fedb5b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * Vẽ lớp phủ chớp sáng va chạm (Impact Flash) lên trên toàn màn hình
   */
  public drawImpactFlash(ctx: CanvasRenderingContext2D): void {
    if (this.impactFlashAlpha > 0.02) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${this.impactFlashAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);
      ctx.restore();
    }
  }
}
