/**
 * 音频管理器
 * 负责管理应用的音效播放
 */

export class AudioUtils {
  private audioContext: AudioContext | null = null
  private masterVolume = 0.7
  private soundEffectsVolume = 0.8
  private enabled = true
  private backgroundMusicEnabled = false
  private backgroundMusicVolume = 0.5
  private backgroundMusic: HTMLAudioElement | null = null
  private backgroundMusicInitialized = false

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
   * 设置背景音乐启用状态
   */
  setBackgroundMusicEnabled(enabled: boolean) {
    const wasEnabled = this.backgroundMusicEnabled
    this.backgroundMusicEnabled = enabled
    
    console.log('背景音乐状态变化:', { wasEnabled, enabled, willUpdate: wasEnabled !== enabled })
    
    // 只有在状态真正改变时才更新播放状态
    if (wasEnabled !== enabled) {
      console.log('调用 updateBackgroundMusicState')
      this.updateBackgroundMusicState()
    } else {
      console.log('状态未改变，跳过更新')
    }
  }

  /**
   * 设置背景音乐音量
   */
  setBackgroundMusicVolume(volume: number) {
    this.backgroundMusicVolume = Math.max(0, Math.min(1, volume / 100))
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.backgroundMusicVolume * this.masterVolume
    }
  }

  /**
   * 设置主音量（同时更新背景音乐音量）
   */
  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume / 100))
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.backgroundMusicVolume * this.masterVolume
    }
  }

  /**
   * 初始化背景音乐
   */
  private async initBackgroundMusic(): Promise<void> {
    if (this.backgroundMusicInitialized) return

    try {
      this.backgroundMusic = new Audio('/bgm.mp3')
      this.backgroundMusic.loop = true
      this.backgroundMusic.volume = this.backgroundMusicVolume * this.masterVolume
      this.backgroundMusic.preload = 'auto'
      
      // 设置静音模式以避免自动播放限制
      this.backgroundMusic.muted = true
      
      this.backgroundMusicInitialized = true
      console.log('背景音乐初始化成功')
    } catch (error) {
      console.warn('背景音乐初始化失败:', error)
    }
  }

  /**
   * 更新背景音乐播放状态
   */
  private async updateBackgroundMusicState(): Promise<void> {
    console.log('更新背景音乐状态:', { 
      enabled: this.backgroundMusicEnabled, 
      hasMusic: !!this.backgroundMusic,
      musicPaused: this.backgroundMusic?.paused,
      musicMuted: this.backgroundMusic?.muted
    })
    
    if (!this.backgroundMusicEnabled) {
      if (this.backgroundMusic) {
        console.log('停止背景音乐播放')
        this.backgroundMusic.pause()
        this.backgroundMusic.currentTime = 0
        this.backgroundMusic.muted = true // 确保静音
        console.log('背景音乐已停止，状态:', {
          paused: this.backgroundMusic.paused,
          muted: this.backgroundMusic.muted,
          currentTime: this.backgroundMusic.currentTime
        })
      } else {
        console.log('没有背景音乐实例，无需停止')
      }
      return
    }

    await this.initBackgroundMusic()
    
    if (this.backgroundMusic && this.backgroundMusicEnabled) {
      try {
        // 取消静音并播放
        this.backgroundMusic.muted = false
        await this.backgroundMusic.play()
        console.log('背景音乐开始播放')
      } catch (error) {
        console.warn('背景音乐播放失败:', error)
        // 如果播放失败，可能是因为用户交互限制，保持静音状态
        this.backgroundMusic.muted = true
      }
    }
  }

  /**
   * 开始播放背景音乐（需要用户交互触发）
   */
  public async startBackgroundMusic(): Promise<void> {
    if (!this.backgroundMusicEnabled) return
    
    await this.initBackgroundMusic()
    await this.updateBackgroundMusicState()
  }

  /**
   * 停止播放背景音乐
   */
  public stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause()
      this.backgroundMusic.currentTime = 0
    }
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
