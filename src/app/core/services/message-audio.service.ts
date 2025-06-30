import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { Message } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class MessageAudioService {
  recorder: any = {};
  stream: any = {};
  record = false;
  chunks: any = [];
  audioInSeconds = {};
  elapsedSeconds = 0;
  timer: any;

  /**
   * Converts a Blob object to a Base64-encoded string.
   *
   * @param {Blob} blob - The Blob object to convert.
   * @return {Promise<string>} A promise that resolves with the Base64-encoded string representation of the Blob.
   */
  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Creates an audio message element from a Blob and appends it to the specified DOM element.
   *
   * @param {any} blob - The audio Blob to be converted into an audio element.
   * @param {string} [element=".thread-messages"] - A CSS selector string for the element to which the audio will be appended.
   * @return {void} This function does not return a value.
   */
  createAudioMessage(blob: any, element = ".thread-messages"): void {
    const url = URL.createObjectURL(blob);
    const audio = document.createElement('audio');
    audio.src = url;
    audio.controls = true;
    document.querySelector(element)?.appendChild(audio);
  }

  /**
   * Starts audio recording using the user's microphone.
   *
   * @return {Promise<void>} A promise that resolves when recording has started.
   */
  async startRecord(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.recorder = new MediaRecorder(this.stream);
    this.recorder.ondataavailable = (e: any) => this.chunks.push(e.data);
    this.recorder.start();
    this.record = true;
    this.startTimer();
  }

  /**
   * Stops the recording and returns the resulting audio Blob.
   *
   * @param {any} recorder - The MediaRecorder instance to stop.
   * @param {any} stream - The MediaStream instance whose tracks should be stopped.
   * @return {Promise<Blob>} A promise that resolves with the recorded audio as a Blob.
   */
  async recordStop(recorder: any, stream: any): Promise<Blob> {
    recorder.stop();
    this.stopTimer();
    await new Promise(r => recorder.onstop = r);
    stream.getTracks().forEach((t: any) => t.stop());
    this.record = false;
    return new Blob(this.chunks, { type: 'audio/webm' });
  }

  /**
   * Starts a timer that increments `elapsedSeconds` every second.
   *
   * @return {void} This function does not return a value.
   */
  startTimer() {
    this.timer = setInterval(() => {
      this.elapsedSeconds++;
    }, 1000);
  }

  /**
   * Stops the running timer by clearing the interval.
   *
   * @return {void} This function does not return a value.
   */
  stopTimer() {
    clearInterval(this.timer);
  }

  /**
   * Creates a clean audio message object for direct messages.
   *
   * @param {string} base64 - The Base64-encoded audio string.
   * @param {string} [id=""] - The receiver ID.
   * @param {User} user - The user object containing sender information.
   * @return {Object} An object representing a direct audio message including metadata like timestamp and user ID.
   */
  // getCleanDirectAudioMessage(base64: string, id = "", user: User): {} {
  //   return {
  //     audio: base64,
  //     timestamp: Date.now(),
  //     name: user.displayName,
  //     text: '',
  //     userId: user.id,
  //     receiverId: id,
  //     isDirectMessage: true,
  //     channelId: '',
  //     reactions: {},
  //     replies: 0,
  //   };
  // }

  /**
   * Creates a clean audio message object for channel messages.
   *
   * @param {string} base64 - The Base64-encoded audio string.
   * @param {string} [id=""] - The channel ID.
   * @param {User} user - The user object containing sender information.
   * @return {Object} An object representing a channel audio message including metadata like timestamp and channel ID.
   */
  // getCleanChannelAudioMessage(base64: string, id = "", user: User): {} {
  //   return {
  //     audio: base64,
  //     timestamp: Date.now(),
  //     name: user.displayName,
  //     text: '',
  //     userId: user.id,
  //     receiverId: '',
  //     isDirectMessage: false,
  //     channelId: id,
  //     reactions: {},
  //     replies: 0,
  //   };
  // }

  getCleanAudioMessage(base64: string, opts: {
    id: string;
    user: User;
    channelId?: string;
    threadId?: string;
    receiverId?: string;
    isDirect: boolean;
  }): Message {
    return {
      id: opts.id,
      audio: base64,
      timestamp: Date.now(),
      name: opts.user.displayName,
      text: '',
      userId: opts.user.id,
      receiverId: opts.receiverId,
      isDirectMessage: opts.isDirect,
      channelId: opts.channelId,
      threadId: opts.threadId,
      reactions: [],
      replies: 0,
    };
  }

  /**
   * Converts a number of seconds into a formatted time string (e.g., "1:09").
   *
   * @param {number} seconds - The number of seconds to format.
   * @return {string} A string representing the formatted time in minutes and seconds.
   */
  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const totalSeconds = Math.round(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  }
}