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
  @Input() audio = "";
  @ViewChild('audioRef') audioElement!: ElementRef<HTMLAudioElement>;
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  public audioService = inject(MessageAudioService);

  togglePlay() {
    const audio = this.audioElement.nativeElement;
    this.isPlaying ? audio.pause() : audio.play();
    this.isPlaying = !this.isPlaying;
  }

  onTimeUpdate() {
    const audio = this.audioElement.nativeElement;
    this.currentTime = audio.currentTime;
    this.duration = audio.duration || 0;
  }

  onEnded() {
    this.audioElement.nativeElement.currentTime = 0;
    this.isPlaying = false;
  }

  getProgress(): number {
    if (!this.duration) return 0;
    return (this.currentTime / this.duration) * 100;
  }

  seek(event: MouseEvent) {
    const bar = (event.target as HTMLElement).closest('.progress-bar');
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const audio = this.audioElement.nativeElement;
    audio.currentTime = percentage * this.duration;
  }

  loadDuraction() {
    this.duration = this.audioElement.nativeElement.duration;
  }
}