/**
 * 音频管理器
 * 负责管理应用的音效播放
 */

export class AudioUtils {
  private audioContext: AudioContext | null = null
  private masterVolume = 0.7
  private soundEffectsVolume = 0.8
  private enabled = true

  constructor() {
    // 不在这里初始化，改为按需初始化
  }

  /**
   * 初始化音频上下文（需要用户交互）
   */
  public async initAudioContext(): Promise<void> {
    if (this.audioContext) return

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // 如果音频上下文被挂起，需要恢复
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }
    } catch (error) {
      console.warn('Web Audio API not supported:', error)
    }
  }

  /**
   * 设置主音量
   */
  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume / 100))
  }

  /**
   * 设置音效音量
   */
  setSoundEffectsVolume(volume: number) {
    this.soundEffectsVolume = Math.max(0, Math.min(1, volume / 100))
  }

  /**
   * 启用/禁用音效
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  /**
   * 播放拼图放置音效
   */
  async playPiecePlaced() {
    if (!this.enabled) return
    await this.initAudioContext()
    if (!this.audioContext) return
    this.playTone(440, 0.1, 'sine') // A4音符
  }

  /**
   * 播放拼图完成音效
   */
  async playPuzzleCompleted() {
    if (!this.enabled) return
    await this.initAudioContext()
    if (!this.audioContext) return
    // 播放胜利旋律
    const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, 'sine')
      }, index * 150)
    })
  }

  /**
   * 播放按钮点击音效
   */
  async playButtonClick() {
    if (!this.enabled) return
    await this.initAudioContext()
    if (!this.audioContext) return
    this.playTone(800, 0.05, 'square')
  }

  /**
   * 播放错误音效
   */
  async playError() {
    if (!this.enabled) return
    await this.initAudioContext()
    if (!this.audioContext) return
    this.playTone(200, 0.2, 'sawtooth')
  }

  /**
   * 播放通用音效（用于试听）
   */
  async playTestSound() {
    if (!this.enabled) return
    await this.initAudioContext()
    if (!this.audioContext) return
    // 播放一个简单的测试音效序列
    const sequence = [
      { freq: 440, duration: 0.1, delay: 0 },
      { freq: 554, duration: 0.1, delay: 150 },
      { freq: 659, duration: 0.2, delay: 300 }
    ]

    sequence.forEach(note => {
      setTimeout(() => {
        this.playTone(note.freq, note.duration, 'sine')
      }, note.delay)
    })
  }

  /**
   * 播放指定频率和时长的音调
   */
  private playTone(frequency: number, duration: number, waveType: OscillatorType = 'sine') {
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
    oscillator.type = waveType

    const volume = this.masterVolume * this.soundEffectsVolume
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume * 0.3, this.audioContext.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  /**
   * 销毁音频上下文
   */
  dispose() {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

// 创建全局音频管理器实例
export const audioUtils = new AudioUtils()
