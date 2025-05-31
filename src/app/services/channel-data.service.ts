import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { Channel } from '../models/channel.model';
import { Observable, map } from 'rxjs';
import { doc, updateDoc, deleteDoc, addDoc, collection, setDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ChannelDataService {

  private readonly collectionPath = 'channels';

  constructor(private firebaseService: FirebaseService) { }

  getChannels(): Observable<Channel[]> {
    return this.firebaseService.getColRef(this.collectionPath).pipe(
      map((docs) =>
        docs.map(
          (docData: any) =>
            new Channel({
              id: docData.id,
              name: docData.name,
              description: docData.description,
              members: docData.members ?? [],
              messages: docData.messages ?? [],
              createdBy: docData.createdBy,
            })
        )
      )
    );
  }

  async addChannel(channel: Channel): Promise<void> {
    if (!channel) return;
    const collectionRef = this.firebaseService.getDocRef(this.collectionPath);
    const docRef = doc(collectionRef); // Neue Referenz mit ID
    channel.id = docRef.id;
    await setDoc(docRef, this.getCleanJson(channel));
  }

  async updateChannel(channel: Channel): Promise<void> {
    if (!channel?.id) return;
    const docRef = this.firebaseService.getSingleDocRef(this.collectionPath, channel.id);
    await updateDoc(docRef, this.getCleanJson(channel));
  }

  async deleteChannel(channelId: string): Promise<void> {
    if (!channelId) return;
    const docRef = this.firebaseService.getSingleDocRef(this.collectionPath, channelId);
    await deleteDoc(docRef);
  }

  private getCleanJson(channel: Channel): any {
    return {
      id: channel.id,
      name: channel.name,
      description: channel.description,
      members: channel.members,
      messages: channel.messages,
      createdBy: channel.createdBy,
    };
  }
}
