import { createContext, useContext } from 'react';
import type { AppData, Command, Context, Role } from '../domain/types';
export interface Workspace { data:AppData; ctx:Context; demo:boolean; lang:'ar'|'en'; t:(ar:string,en:string)=>string; run:(cmd:Command)=>Promise<boolean>; busy:boolean; toast:(message:string)=>void; setLang:(l:'ar'|'en')=>void; setRole:(role:Role)=>void; reset:()=>Promise<void>; }
export const WorkspaceContext=createContext<Workspace|null>(null);
export function useWorkspace(){const v=useContext(WorkspaceContext);if(!v)throw new Error('Workspace required');return v;}
