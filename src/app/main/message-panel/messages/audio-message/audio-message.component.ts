import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';

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

  togglePlay() {
    const audio = this.audioElement.nativeElement;
    this.isPlaying ? audio.pause() : audio.play();
    this.isPlaying = !this.isPlaying;
  }
}