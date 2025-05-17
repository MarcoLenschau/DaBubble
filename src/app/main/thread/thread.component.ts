import { CommonModule, NgClass } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-thread',
  imports: [NgClass, CommonModule],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss',
})
export class ThreadComponent {
  hovered = false;

  resetHoverState() {
    this.hovered = false;
  }

  setHoverState(index: number, state: boolean) {
    this.messages.forEach((msg, i) => {
      msg.hovered = i === index ? state : false;
    });
  }

  messages = [
    {
      name: 'Noah Braun',
      time: '14:24 Uhr',
      text: 'Hallo zusammen, wie läuft das aktuelle Projekt bei euch?',
      isSelf: false,
      isThreadStarter: true,
      hovered: false,
    },
    {
      name: 'Sofia Müller',
      time: '15:31 Uhr',
      text: 'Bei uns läuft alles gut, wir sind fast mit der neuen Funktion fertig.',
      isSelf: false,
      isThreadStarter: false,
      hovered: false,
    },
    {
      name: 'Anna Müller',
      time: '15:37 Uhr',
      text: 'Super, dann können wir ja bald mit dem Testing starten! Lorem ipsum dolor sit, amet consectetur adipisicing elit. ',
      isSelf: false,
      isThreadStarter: false,
      hovered: false,
    },
    {
      name: 'Frederik Beck',
      time: '15:44 Uhr',
      text: 'Ja genau.',
      isSelf: true,
      isThreadStarter: false,
      hovered: false,
    },
  ];
}
