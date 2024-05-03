import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import style from './style.module.css';
import { AIMessage } from '../../..';

function AttachmentIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 448 512"
      height={24}
      width={24}
    >
      <path
        fill="#8980f7"
        d="M364.2 83.8c-24.4-24.4-64-24.4-88.4 0l-184 184c-42.1 42.1-42.1 110.3 0 152.4s110.3 42.1 152.4 0l152-152c10.9-10.9 28.7-10.9 39.6 0s10.9 28.7 0 39.6l-152 152c-64 64-167.6 64-231.6 0s-64-167.6 0-231.6l184-184c46.3-46.3 121.3-46.3 167.6 0s46.3 121.3 0 167.6l-176 176c-28.6 28.6-75 28.6-103.6 0s-28.6-75 0-103.6l144-144c10.9-10.9 28.7-10.9 39.6 0s10.9 28.7 0 39.6l-144 144c-6.7 6.7-6.7 17.7 0 24.4s17.7 6.7 24.4 0l176-176c24.4-24.4 24.4-64 0-88.4z"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      height={24}
      width={24}
    >
      <path
        fill="#8980f7"
        d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480V396.4c0-4 1.5-7.8 4.2-10.7L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={24}
      height={24}
    >
      <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z" />
    </svg>
  );
}

function timeDisplay(datetime: string) {
  return dayjs(datetime).format('h:mm A');
}

export default function Chat() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [message, setMessage] = useState<string>('');
  useEffect(() => {
    window.electron.ipcRenderer.sendMessage('chat-list', {});
    window.electron.ipcRenderer.on('chat-list', (args) => {
      setMessages((args as AIMessage[]).reverse());
    });
    window.electron.ipcRenderer.on('chat-new-message', (args) => {
      console.log(args);
      setMessages((prev) => [args as AIMessage, ...prev]);
    });
  }, []);
  return (
    <div className={style.chat}>
      <div className={style.header}>
        <div className={style.title}>My Assist</div>
        <button
          type="button"
          className="icon-button"
          onClick={() => {
            window.electron.ipcRenderer.sendMessage('open-settings', {});
          }}
        >
          <SettingsIcon />
        </button>
      </div>
      <div className={style.messages}>
        {messages.map((msg) => {
          return (
            <div
              key={msg.id}
              className={`${style.message} ${
                msg.role === 'user' ? style.self : ''
              }`}
              data-time={timeDisplay(msg.timestamp as string)}
            >
              <div className={style.content}>
                {msg.content.map((part) => part.text).join(' ')}
              </div>
            </div>
          );
        })}
      </div>
      <div className={style.input}>
        <button type="button" className="icon-button">
          <AttachmentIcon />
        </button>
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
          onKeyUp={(e) => {
            if (e.key === 'Enter') {
              window.electron.ipcRenderer.sendMessage('chat-message', {
                message,
              });
              setMessage('');
            }
          }}
        />
        <button
          type="button"
          className="icon-button"
          onClick={() => {
            window.electron.ipcRenderer.sendMessage('chat-message', {
              message,
            });
            setMessage('');
          }}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
