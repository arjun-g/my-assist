import {
  addToDo,
  deleteToDo,
  displayToDos,
  getToDos,
  searchToDos
} from './todo';

import {
  sendMessage,
  openBrowser,
  conversationSearch,
  saveAssistantName
} from "./system";

const FUNCTIONS: { [key: string]: Function } = {
  addToDo,
  deleteToDo,
  displayToDos,
  getToDos,
  searchToDos,
  sendMessage,
  openBrowser,
  conversationSearch,
  saveAssistantName
};

export default FUNCTIONS;
