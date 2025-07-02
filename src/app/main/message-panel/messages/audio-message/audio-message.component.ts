import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
import { MessageAudioService } from '../../../../core/services/message-audio.service';

@Component({
  selector: 'app-audio-message',
  imports: [CommonModule],
  templateUrl: './audio-message.component.html',
  styleUrl: './audio-message.component.scss'
})
export class AudioMessageComponent {
  /** The audio source URL */
  @Input() audio = "";

  /** Reference to the HTML audio element */
  @ViewChild('audioRef') audioElement!: ElementRef<HTMLAudioElement>;

  /** Indicates if the audio is currently playing */
  isPlaying = false;

  /** Current playback time in seconds */
  currentTime = 0;

  /** Total duration of the audio in seconds */
  duration = 0;

  /** Injected audio service for managing audio playback */
  public audioService = inject(MessageAudioService);

  /**
   * Toggles audio playback between play and pause.
   */
  togglePlay() {
    const audio = this.audioElement.nativeElement;
    this.isPlaying ? audio.pause() : audio.play();
    this.isPlaying = !this.isPlaying;
  }

  /**
   * Updates the current playback time and duration.
   * Should be called on the audio element's timeupdate event.
   */
  onTimeUpdate() {
    const audio = this.audioElement.nativeElement;
    this.currentTime = audio.currentTime;
    this.duration = audio.duration || 0;
  }

  /**
   * Handles the audio ended event.
   * Resets playback time and updates playing state.
   */
  onEnded() {
    this.audioElement.nativeElement.currentTime = 0;
    this.isPlaying = false;
  }

  /**
   * Returns the current playback progress as a percentage.
   * @returns {number} Progress percentage (0-100)
   */
  getProgress(): number {
    if (!this.duration) return 0;
    return (this.currentTime / this.duration) * 100;
  }

  /**
   * Seeks the audio to a position based on user click on the progress bar.
   * @param event MouseEvent from the progress bar click
   */
  seek(event: MouseEvent) {
    const bar = (event.target as HTMLElement).closest('.progress-bar');
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const audio = this.audioElement.nativeElement;
    audio.currentTime = percentage * this.duration;
  }

  /**
   * Loads and sets the audio duration.
   * Should be called when the audio metadata is loaded.
   */
  loadDuraction() {
    this.duration = this.audioElement.nativeElement.duration;
  }
}