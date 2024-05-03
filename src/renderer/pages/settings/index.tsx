import { useEffect, useRef, useState } from 'react';

import style from './style.module.css';

export default function Settings() {
  const [name, setName] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [functions, setFunctions] = useState<any[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    window.electron.ipcRenderer.sendMessage('get-settings', {});
    window.electron.ipcRenderer.on('get-settings', (args) => {
      setName(args.name);
      setApiKey(args.apiKey);
      setFunctions(args.functions);
      formRef.current?.reset();
    });
  }, []);

  return (
    <div className={style.settings}>
      <h2>Assitant Name</h2>
      <div className={style.section}>
        <input
          type="text"
          placeholder="Assistant Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            window.electron.ipcRenderer.sendMessage('save-settings', { name });
          }}
        >
          Save
        </button>
      </div>
      <h2>API Key</h2>
      <div className={style.section}>
        <input
          type="text"
          placeholder="API Key"
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
          }}
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            window.electron.ipcRenderer.sendMessage('save-settings', {
              apiKey,
            });
          }}
        >
          Save
        </button>
      </div>
      <h2>Functions</h2>
      <div className={style.section}>
        <form
          ref={formRef}
          className={style.section}
          onSubmit={(e) => {
            e.preventDefault();
            window.electron.ipcRenderer.sendMessage('save-settings', {
              addFunction: {
                functionName: e.target.functionName.value,
                functionDefinition: e.target.functionDefinition.value,
                code: e.target.code.value,
              },
            });
          }}
        >
          <input
            type="text"
            placeholder="Function Name"
            name="functionName"
            required
          />
          <textarea
            placeholder="Function Definition"
            name="functionDefinition"
            required
          />
          <textarea placeholder="Code" name="code" required />
          <button type="submit">Add</button>
        </form>
      </div>
      <div className={style.section}>
        {functions.map((func) => {
          return (
            <div key={func.id} className={style.function}>
              <h3>{func.metadata.name}</h3>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  window.electron.ipcRenderer.sendMessage('save-settings', {
                    deleteFunction: func.id,
                  });
                }}
              >Delete</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
