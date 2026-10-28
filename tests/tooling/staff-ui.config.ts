import { defineConfig } from '@playwright/test';
import main from '../../playwright.config';
export default defineConfig({
 ...main,testDir:'../e2e',testIgnore:[],testMatch:'staff.spec.ts',
 use:{...main.use,baseURL:'http://127.0.0.1:5175'},
 webServer:{command:'npm.cmd run dev -- --port 5175 --strictPort',url:'http://127.0.0.1:5175',reuseExistingServer:false,
  env:{VITE_SUPABASE_URL:'https://abcdefghijklmnopqrst.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'synthetic-ui-only'}},
});
