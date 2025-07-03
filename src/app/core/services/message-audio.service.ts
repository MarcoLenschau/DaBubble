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
    // document.querySelector(element)?.appendChild(audio);
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
    this.endRecord(recorder, stream);
    return new Blob(this.chunks, { type: 'audio/webm' });
  }

  /**
   * Ends the audio recording session by stopping the recorder and associated media stream.
   *
   * @param recorder - The audio recorder instance to be stopped.
   * @param stream - The media stream associated with the recording, whose tracks will be stopped.
   * @returns A promise that resolves when the recorder has fully stopped and the stream tracks are stopped.
   */
  async endRecord(recorder: any, stream: any): Promise<void> {
    this.elapsedSeconds = 0;
    recorder.stop();
    this.stopTimer();
    await new Promise(r => recorder.onstop = r);
    stream.getTracks().forEach((t: any) => t.stop());
    this.record = false;
  }

  /**
   * Starts a timer that increments `elapsedSeconds` every second.
   *
   * @return {void} This function does not return a value.
   */
  startTimer(): void {
    this.timer = setInterval(() => {
      this.elapsedSeconds++;
    }, 1000);
  }

  /**
   * Stops the running timer by clearing the interval.
   *
   * @return {void} This function does not return a value.
   */
  stopTimer(): void {
    clearInterval(this.timer);
  }

  /**
   * Creates a new audio message object with the provided base64 audio data and message options.
   *
   * @param base64 - The base64-encoded audio string representing the audio message content.
   * @param opts - An object containing message metadata:
   *   @param opts.id - The unique identifier for the message.
   *   @param opts.user - The user sending the message.
   *   @param opts.channelId - (Optional) The ID of the channel where the message is sent.
   *   @param opts.threadId - (Optional) The ID of the thread where the message is sent.
   *   @param opts.receiverId - (Optional) The ID of the receiver (for direct messages).
   *   @param opts.isDirect - Indicates if the message is a direct message.
   * @returns A `Message` object representing the audio message, ready to be sent or stored.
   */
  getCleanAudioMessage(base64: string, opts: { id: string; user: User; channelId?: string; threadId?: string; receiverId?: string; isDirect: boolean; }): Message {
    return {
      id: opts.id, audio: base64, timestamp: Date.now(),
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