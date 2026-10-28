import { fireEvent,render,screen } from '@testing-library/react';
import { expect,it,vi } from 'vitest';
import { MemoryRouter,Route,Routes } from 'react-router-dom';
import { WorkspaceContext } from '../src/app/context';
import { seedData } from '../src/data/seed';
import Profile from '../src/pages/Profile';
it('new medication form precedes saved medication rows, receives focus, and timeline starts collapsed',()=>{
const data=seedData(),p=data.patients[0];render(<MemoryRouter initialEntries={[`/patients/${p.id}`]}><WorkspaceContext.Provider value={{data,ctx:{role:'owner',name:'Test',pharmacyId:'test'},demo:true,lang:'en',t:(_ar,en)=>en,run:vi.fn(),busy:false,toast:vi.fn(),setLang:vi.fn(),setRole:vi.fn(),reset:vi.fn()}}><Routes><Route path="/patients/:id" element={<Profile/>}/></Routes></WorkspaceContext.Provider></MemoryRouter>);
expect(screen.getByTestId('refill-timeline')).not.toHaveAttribute('open');
fireEvent.click(screen.getByRole('button',{name:'Add Medication'}));
const form=screen.getByTestId('medication-form'),list=screen.getByTestId('medication-list');
expect(form.compareDocumentPosition(list)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
expect(screen.getByLabelText(/Medication — type to search/)).toHaveFocus();
});
