import { act,render,screen } from '@testing-library/react';
import { QueryClient,QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { expect,it,vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
const auth=vi.hoisted(()=>({getSession:vi.fn(),listen:undefined as undefined|((event:string,session:Session|null)=>void)}));
vi.mock('../src/data/repository',()=>({
 supabase:{auth:{getSession:auth.getSession,onAuthStateChange:(fn:typeof auth.listen)=>{auth.listen=fn;return {data:{subscription:{unsubscribe:vi.fn()}}};}},
  from:()=>({select(){return this;},eq(){return this;},then(fn:(result:{data:never[];error:null})=>void){return Promise.resolve(fn({data:[],error:null}));}})},
 createDemoRepository:vi.fn(),createLiveRepository:vi.fn(),
}));
import App from '../src/App';

it('sign-out clears cached records and a delayed initial session cannot restore them',async()=>{
 let resolve!:(v:{data:{session:Session|null};error:null})=>void;
 auth.getSession.mockReturnValue(new Promise(r=>{resolve=r;}));
 const cache=new QueryClient({defaultOptions:{queries:{retry:false}}});
 cache.setQueryData(['workspace','previous-actor'],{notes:'Synthetic confidential fixture'});
 render(<QueryClientProvider client={cache}><MemoryRouter initialEntries={['/app']}><App/></MemoryRouter></QueryClientProvider>);
 await act(async()=>{auth.listen?.('SIGNED_OUT',null);});
 expect(cache.getQueryData(['workspace','previous-actor'])).toBeUndefined();
 const synthetic={user:{id:'10000000-0000-4000-8000-000000000001'}} as Session;
 await act(async()=>{resolve({data:{session:synthetic},error:null});});
 expect(screen.getByRole('button',{name:'تسجيل الدخول / Sign in'})).toBeInTheDocument();
 expect(screen.queryByText(/Your account needs an active pharmacy membership/)).not.toBeInTheDocument();
 expect(screen.queryByText('Synthetic confidential fixture')).not.toBeInTheDocument();
});
