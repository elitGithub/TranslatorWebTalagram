/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

import type {ArgumentTypes, SuperReturnType} from '../types';
import findAndSplice from './array/findAndSplice';


export type EventListenerListeners = Record<string, Function>;

/**
 * Better not to remove listeners during setting
 * Should add listener callback only once
 */

type ListenerObject<T> = {callback: T, options: boolean | AddEventListenerOptions};

export default class EventListenerBase<Listeners extends EventListenerListeners> {
  protected listeners: Partial<{
    [k in keyof Listeners]: Array<ListenerObject<Listeners[k]>>
  }>;
  protected listenerResults: Partial<{
    [k in keyof Listeners]: ArgumentTypes<Listeners[k]>
  }>;

  private reuseResults: boolean;

  constructor(reuseResults?: boolean) {
    this._constructor(reuseResults);
  }

  public _constructor(reuseResults?: boolean): any {
    this.reuseResults = reuseResults;
    this.listeners = {};
    this.listenerResults = {};
  }

  public addEventListener<T extends keyof Listeners>(name: T, callback: Listeners[T], options?: boolean | AddEventListenerOptions) {
    (this.listeners[name] ??= []).push({callback, options}); // ! add before because if you don't, you won't be able to delete it from callback

    if(this.listenerResults.hasOwnProperty(name)) {
      callback(...this.listenerResults[name]);

      if((options as AddEventListenerOptions)?.once) {
        this.listeners[name].pop();
        return;
      }
    }
  }

  public addMultipleEventsListeners(obj: {
    [name in keyof Listeners]?: Listeners[name]
  }) {
    for(const i in obj) {
      this.addEventListener(i, obj[i]);
    }
  }

  public removeEventListener<T extends keyof Listeners>(
    name: T,
    callback: Listeners[T],
    options?: boolean | AddEventListenerOptions
  ) {
    if(this.listeners[name]) {
      findAndSplice(this.listeners[name], (l) => l.callback === callback);
    }
  }

  protected invokeListenerCallback<T extends keyof Listeners, L extends ListenerObject<any>>(
    name: T,
    listener: L,
    ...args: ArgumentTypes<L['callback']>
  ) {
    let result: any, error: any;
    try {
      result = listener.callback(...args);
    } catch(err) {
      error = err;
    }

    if((listener.options as AddEventListenerOptions)?.once) {
      this.removeEventListener(name, listener.callback);
    }

    if(error) {
      throw error;
    }

    return result;
  }

  private _dispatchEvent<T extends keyof Listeners>(
    name: T,
    collectResults: boolean,
    ...args: ArgumentTypes<Listeners[T]>
  ) {
    if(this.reuseResults) {
      this.listenerResults[name] = args;
    }

    const arr: Array<SuperReturnType<Listeners[typeof name]>> = collectResults && [];

    const listeners = this.listeners[name];
    if(listeners) {
      // ! this one will guarantee execution even if delete another listener during setting
      const left = listeners.slice();
      left.forEach((listener) => {
        const index = listeners.findIndex((l) => l.callback === listener.callback);
        if(index === -1) {
          return;
        }

        const result = this.invokeListenerCallback(name, listener, ...args);
        if(arr) {
          arr.push(result);
        }
      });
    }

    return arr;
  }

  public dispatchResultableEvent<T extends keyof Listeners>(name: T, ...args: ArgumentTypes<Listeners[T]>) {
    return this._dispatchEvent(name, true, ...args);
  }

  // * must be protected, but who cares
  public dispatchEvent<L extends EventListenerListeners = Listeners, T extends keyof L = keyof L>(
    name: T,
    ...args: ArgumentTypes<L[T]>
  ) {
    // @ts-ignore
    this._dispatchEvent(name, false, ...args);
  }

  public cleanup() {
    this.listeners = {};
    this.listenerResults = {};
  }
}
