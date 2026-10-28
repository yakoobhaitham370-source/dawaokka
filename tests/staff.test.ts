import { describe,expect,it,vi } from 'vitest';
import { loadStaffTasks } from '../src/data/staff';
import type { supabase } from '../src/data/repository';
type Client=NonNullable<typeof supabase>;
describe('restricted staff data boundary',()=>{
 it('loads only the server-projected queue, never patient or audit tables',async()=>{
  const rpc=vi.fn().mockResolvedValue({data:[],error:null}),from=vi.fn();
  await expect(loadStaffTasks('synthetic-tenant',{rpc,from} as unknown as Client)).resolves.toEqual([]);
  expect(rpc).toHaveBeenCalledExactlyOnceWith('staff_followup_queue',{p_pharmacy:'synthetic-tenant'});
  expect(from).not.toHaveBeenCalled();
 });
 it('fails closed when the proposal is absent or authorization is refused',async()=>{
  const rpc=vi.fn().mockResolvedValue({data:null,error:{message:'not authorized'}});
  await expect(loadStaffTasks('synthetic-tenant',{rpc} as unknown as Client)).rejects.toThrow(/unavailable/);
 });
 it('rejects a malformed projection',async()=>{
  const rpc=vi.fn().mockResolvedValue({data:{patients:[]},error:null});
  await expect(loadStaffTasks('synthetic-tenant',{rpc} as unknown as Client)).rejects.toThrow(/unavailable/);
 });
});
