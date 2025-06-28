import { Injectable } from '@angular/core';
import { getAuth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class MessageAudioService {
  recorder: any = {};
  stream: any = {};
  record = false;
  chunks: any = [];
  audioInSeconds = {};
  
  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  createAudioMessage(blob: any, element = ".thread-messages") {
    const url = URL.createObjectURL(blob);
    const audio = document.createElement('audio');
    audio.src = url;
    audio.controls = true;
    document.querySelector(element)?.appendChild(audio);
  }

  async startRecord() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.recorder = new MediaRecorder(this.stream);
    this.recorder.ondataavailable = (e: any) => this.chunks.push(e.data);
    this.recorder.start();
    this.record = true;
  }

  async recordStop(recorder: any, stream: any) {
    recorder.stop();
    await new Promise(r => recorder.onstop = r);
    stream.getTracks().forEach((t: any) => t.stop());
    this.record = false;
    return new Blob(this.chunks, { type: 'audio/webm' });
  }

  getCleanAudioMessage(base64: string, receiverId = "") {
    const auth = getAuth();
    return {
      audio: base64,
      timestamp: Date.now(),
      userId: auth.currentUser?.displayName?.toLowerCase(),
      name: auth.currentUser?.displayName,
      receiverId: receiverId
    };
  }
}