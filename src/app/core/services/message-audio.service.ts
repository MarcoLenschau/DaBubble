import { Injectable } from '@angular/core';
import { getAuth } from '@angular/fire/auth';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class MessageAudioService {
  recorder: any = {};
  stream: any = {};
  record = false;
  chunks: any = [];
  audioInSeconds = {};

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
    await new Promise(r => recorder.onstop = r);
    stream.getTracks().forEach((t: any) => t.stop());
    this.record = false;
    return new Blob(this.chunks, { type: 'audio/webm' });
  }

  /**
   * Generates a structured audio message object to be sent or stored.
   *
   * @param {string} base64 - The Base64-encoded audio string.
   * @param {string} [receiverId=""] - The ID of the message receiver.
   * @return {Object} An object containing the audio message data including timestamp, sender, and receiver information.
   */

  // Original-Code:

  // getCleanAudioMessage(base64: string, receiverId = ""): {} {
  //   const auth = getAuth();
  //   return {
  //     audio: base64,
  //     timestamp: Date.now(),
  //     userId: auth.currentUser?.displayName?.toLowerCase(),
  //     name: auth.currentUser?.displayName,
  //     receiverId: receiverId
  //   };
  // }

  getCleanDirectAudioMessage(base64: string, id = "", user: User): {} {
    const auth = getAuth();
    return {
      audio: base64,
      timestamp: Date.now(),
      name: user.displayName,
      text: '',
      userId: user.id,
      receiverId: id,
      isDirectMessage: true,
      // id
      // threadId,
      channelId: '',
      reactions: {},
      replies: 0,
    };
  }

  getCleanChannelAudioMessage(base64: string, id = "", user: User): {} {
    const auth = getAuth();
    return {
      audio: base64,
      timestamp: Date.now(),
      name: user.displayName,
      text: '',
      userId: user.id,
      receiverId: '',
      isDirectMessage: false,
      // id
      // threadId,
      channelId: id,
      reactions: {},
      replies: 0,
    };
  }
}