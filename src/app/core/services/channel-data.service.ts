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

  /**
   * Fetches all channels from Firestore and maps them to Channel instances.
   *
   * @returns An observable stream of all channels
   */
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
              createdById: docData.createdById,
              createdAt: docData.createdAt,
            })
        )
      )
    );
  }

  /**
   * Adds a new channel to Firestore and generates a unique ID.
   * Sets createdAt to current time if not provided.
   *
   * @param channel The channel to be added
   */
  async addChannel(channel: Channel): Promise<void> {
    if (!channel) return;
    const collectionRef = this.firebaseService.getDocRef(this.collectionPath);
    const docRef = doc(collectionRef);
    channel.id = docRef.id;
    channel.createdAt = channel.createdAt ?? Date.now();
    await setDoc(docRef, this.getCleanJson(channel));
  }

  /**
   * Updates an existing channel document by ID.
   * Does nothing if channel or channel.id is missing.
   */
  async updateChannel(channel: Channel): Promise<void> {
    if (!channel?.id) return;
    const docRef = this.firebaseService.getSingleDocRef(this.collectionPath, channel.id);
    await updateDoc(docRef, this.getCleanJson(channel));
  }

  /**
   * Deletes a channel document by its ID.
   */
  async deleteChannel(channelId: string): Promise<void> {
    if (!channelId) return;
    const docRef = this.firebaseService.getSingleDocRef(this.collectionPath, channelId);
    await deleteDoc(docRef);
  }

  /**
   * Returns a plain object with channel properties,
   * useful for Firestore operations.
   */
  private getCleanJson(channel: Channel): any {
    return {
      id: channel.id,
      name: channel.name,
      description: channel.description,
      members: channel.members,
      messages: channel.messages,
      createdBy: channel.createdBy,
      createdById: channel.createdById,
      createdAt: channel.createdAt,
    };
  }

  /**
   * Updates only the name of a channel in Firestore.
   *
   * @param channelId The ID of the channel to update
   * @param newName The new name to set
   */
  async updateChannelName(channelId: string, newName: string): Promise<void> {
    if (!channelId) return;
    const docRef = this.firebaseService.getSingleDocRef(this.collectionPath, channelId);
    await updateDoc(docRef, { name: newName });
  }

  /**
   * Updates only the description of a channel in Firestore.
   *
   * @param channelId The ID of the channel to update
   * @param newDescription The new description to set
   */
  async updateChannelDescription(channelId: string, newDescription: string): Promise<void> {
    if (!channelId) return;
    const docRef = this.firebaseService.getSingleDocRef(this.collectionPath, channelId);
    await updateDoc(docRef, { description: newDescription });
  }
}