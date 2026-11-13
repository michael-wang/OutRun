import {it,expect,vi,afterEach} from 'vitest';
import {GamepadInput} from '../src/gamepad';
import {InputLatch} from '../src/input';

afterEach(()=>vi.unstubAllGlobals());

it('accepts the very first fresh confirm and does not repeat a held button after screen transition',()=>{
 const status={id:'',hidden:false,textContent:'',setAttribute(){},remove(){}};
 const app={append(){}};
 const buttons=Array.from({length:18},()=>({pressed:false,value:0}));
 const pad={connected:true,mapping:'standard',id:'Test Gamepad',buttons,axes:[0]};
 const document={
  hidden:false,hasFocus:()=>true,createElement:()=>status,
  querySelector:()=>app,getElementById:()=>null,
 };
 const window={addEventListener(){},removeEventListener(){}};
 vi.stubGlobal('document',document);
 vi.stubGlobal('window',window);
 vi.stubGlobal('navigator',{getGamepads:()=>[pad]});
 const actions:string[]=[],input=new InputLatch();
 const controller=new GamepadInput(input,a=>actions.push(a));
 let menu:GamepadInput|undefined;
 try{
  buttons[0].pressed=true;controller.poll(false);
  expect(actions).toEqual(['confirm']); // First press is NOT eaten.
  controller.dispose();
  menu=new GamepadInput(input,a=>actions.push(a));
  menu.poll('stage-menu');
  expect(actions).toEqual(['confirm']); // Held cross must not trigger again.
  buttons[0].pressed=false;menu.poll('stage-menu');
  buttons[0].pressed=true;menu.poll('stage-menu');
  expect(actions).toEqual(['confirm','confirm']);
  menu.poll(false);
  expect(actions).toHaveLength(2);
  buttons[0].pressed=false;menu.poll(false);
  buttons[0].pressed=true;menu.poll(false);
  expect(actions).toHaveLength(3);
 }finally{menu?.dispose();}
});

it('reads held gas/brake on the first driving frame, with no neutralization press',()=>{
 const status={id:'',hidden:false,textContent:'',setAttribute(){},remove(){}};
 const app={append(){}};
 const buttons=Array.from({length:18},()=>({pressed:false,value:0}));
 const pad={connected:true,mapping:'standard',id:'Test Gamepad',buttons,axes:[0]};
 vi.stubGlobal('document',{hidden:false,hasFocus:()=>true,createElement:()=>status,querySelector:()=>app,getElementById:()=>null});
 vi.stubGlobal('window',{addEventListener(){},removeEventListener(){}});
 vi.stubGlobal('navigator',{getGamepads:()=>[pad]});
 const input=new InputLatch(),gamepad=new GamepadInput(input,()=>{});
 try{
  buttons[7].pressed=true;gamepad.poll(true);
  expect(input.snapshot().gas).toBe(true);
  buttons[7].pressed=false;gamepad.poll(true);
  expect(input.snapshot().gas).toBe(false);
 }finally{gamepad.dispose();}
});
