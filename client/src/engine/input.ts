/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * HỆ THỐNG ĐIỀU KHIỂN ĐA NỀN TẢNG (INPUT SYSTEM)
 * Hỗ trợ Bàn phím máy tính + Nút cảm ứng đa điểm (Touch Controls) cho Mobile / Tablet.
 * Bàn phím: A/D/Mũi tên (di chuyển), W/Space (nhảy), J (đánh combo), K (chiêu đặc biệt), L (né), 1-4 (thẻ), P (tạm dừng).
 */

export type InputAction =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'jump'
  | 'attack'
  | 'special'
  | 'dodge'
  | 'card1'
  | 'card2'
  | 'card3'
  | 'card4'
  | 'pause';

export class InputManager {
  private static instance: InputManager;

  // Trạng thái giữ phím (isDown)
  private downActions: Set<InputAction> = new Set();
  // Trạng thái vừa nhấn ở frame hiện tại (wasPressed)
  private pressedActions: Set<InputAction> = new Set();
  private prevDownActions: Set<InputAction> = new Set();

  private touchControlsVisible = true;

  private constructor() {
    this.initKeyboardListeners();
  }

  public static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  private initKeyboardListeners(): void {
    window.addEventListener('keydown', (e) => {
      const action = this.keyToAction(e.code, e.key);
      if (action) {
        // Tránh scroll màn hình khi bấm Space hoặc phím mũi tên
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
          e.preventDefault();
        }
        this.downActions.add(action);
      }
    });

    window.addEventListener('keyup', (e) => {
      const action = this.keyToAction(e.code, e.key);
      if (action) {
        this.downActions.delete(action);
      }
    });
  }

  private keyToAction(code: string, key: string): InputAction | null {
    switch (code) {
      case 'KeyA':
      case 'ArrowLeft':
        return 'left';
      case 'KeyD':
      case 'ArrowRight':
        return 'right';
      case 'KeyW':
      case 'ArrowUp':
        return 'up';
      case 'KeyS':
      case 'ArrowDown':
        return 'down';
      case 'Space':
        return 'jump';
      case 'KeyJ':
        return 'attack';
      case 'KeyK':
        return 'special';
      case 'KeyL':
        return 'dodge';
      case 'Digit1':
        return 'card1';
      case 'Digit2':
        return 'card2';
      case 'Digit3':
        return 'card3';
      case 'Digit4':
        return 'card4';
      case 'KeyP':
        return 'pause';
      default:
        // Hỗ trợ theo key cho bàn phím số
        if (key === '1') return 'card1';
        if (key === '2') return 'card2';
        if (key === '3') return 'card3';
        if (key === '4') return 'card4';
        return null;
    }
  }

  /**
   * Gọi ở đầu mỗi tick vòng lặp game để cập nhật trạng thái vừa bấm (wasPressed)
   */
  public update(): void {
    this.pressedActions.clear();
    for (const act of this.downActions) {
      if (!this.prevDownActions.has(act)) {
        this.pressedActions.add(act);
      }
    }
    this.prevDownActions = new Set(this.downActions);
  }

  /**
   * Kiểm tra hành động có đang được giữ hay không
   */
  public isDown(action: InputAction): boolean {
    return this.downActions.has(action);
  }

  /**
   * Kiểm tra hành động vừa mới được nhấn ở frame hiện tại
   */
  public isPressed(action: InputAction): boolean {
    return this.pressedActions.has(action);
  }

  /**
   * Cập nhật trạng thái từ nút bấm cảm ứng (Virtual Touch Pad)
   */
  public setVirtualAction(action: InputAction, isDown: boolean): void {
    if (isDown) {
      this.downActions.add(action);
    } else {
      this.downActions.delete(action);
    }
  }

  public isTouchControlsVisible(): boolean {
    return this.touchControlsVisible;
  }

  public setTouchControlsVisible(visible: boolean): void {
    this.touchControlsVisible = visible;
  }
}
