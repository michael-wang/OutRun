import {it,expect,vi,afterEach} from 'vitest';
import {GamepadInput} from '../src/gamepad';
import {InputLatch} from '../src/input';

afterEach(()=>vi.unstubAllGlobals());

it('keeps Touchpad-first/L3 photo and independent R3 reset, clearing orbit on focus loss/disconnect',()=>{
 const status={setAttribute(){},remove(){},hidden:false,textContent:''};
 let focused=true,connected=true;
 const pad={connected:true,mapping:'standard',buttons:Array.from({length:18},()=>({pressed:false,value:0})),axes:[0,0,.8]};
 vi.stubGlobal('document',{hidden:false,hasFocus:()=>focused,createElement:()=>status,querySelector:()=>({append(){}}),getElementById:()=>null});
 vi.stubGlobal('window',{addEventListener(){},removeEventListener(){}});
 vi.stubGlobal('navigator',{getGamepads:()=>connected?[pad]:[]});
 const actions:string[]=[],controller=new GamepadInput(new InputLatch(),a=>actions.push(a));
 controller.poll(false);expect(controller.orbitAxis).toBe(.8);
 pad.buttons[10].pressed=true;controller.poll(true);expect(actions).toEqual([]);
 pad.buttons[17].pressed=true;controller.poll(true);expect(actions).toEqual(['photo']);
 pad.buttons[11].pressed=true;controller.poll(true);controller.poll(true);expect(actions).toEqual(['photo','camera-reset']);
 pad.buttons=pad.buttons.slice(0,17);pad.buttons[10].pressed=false;controller.poll(true);
 pad.buttons[10].pressed=true;controller.poll(true);expect(actions.at(-1)).toBe('photo');
 controller.poll(true);pad.buttons[10].pressed=false;pad.buttons[11].pressed=false;controller.poll(true);
 pad.buttons[10].pressed=true;controller.poll(true);pad.buttons[11].pressed=true;controller.poll(true);controller.poll(true);
 expect(actions).toEqual(['photo','camera-reset','photo','photo','camera-reset']);
 focused=false;controller.poll(true);expect(controller.orbitAxis).toBe(0);
 focused=true;controller.poll(true);expect(controller.orbitAxis).toBe(.8);
 connected=false;controller.poll(true);expect(controller.orbitAxis).toBe(0);controller.dispose();
});

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

it('does not replay held confirm on focus recovery or reconnection, but accepts a fresh press',()=>{
 const status={setAttribute(){},remove(){},hidden:false,textContent:''};let focused=true,connected=true;
 const buttons=Array.from({length:18},()=>({pressed:false,value:0})),pad={id:'pad',index:0,connected:true,mapping:'standard',buttons,axes:[0,0,0,0]};
 vi.stubGlobal('document',{hidden:false,hasFocus:()=>focused,createElement:()=>status,querySelector:()=>({append(){}}),getElementById:()=>null});vi.stubGlobal('window',{addEventListener(){},removeEventListener(){}});vi.stubGlobal('navigator',{getGamepads:()=>connected?[pad]:[]});
 const actions:string[]=[],g=new GamepadInput(new InputLatch(),a=>actions.push(a));g.poll(false);
 focused=false;g.poll(false);buttons[0].pressed=true;focused=true;g.poll(false);g.poll(false);expect(actions).toEqual([]);
 buttons[0].pressed=false;g.poll(false);buttons[0].pressed=true;g.poll(false);expect(actions).toEqual(['confirm']);
 connected=false;g.poll(false);connected=true;g.poll(false);g.poll(false);expect(actions).toEqual(['confirm']);
 buttons[0].pressed=false;g.poll(false);buttons[0].pressed=true;g.poll(false);expect(actions).toEqual(['confirm','confirm']);g.dispose();
});

it('handles OPTIONS as a transition without reinserting held throttle after pausing',()=>{
 const status={setAttribute(){},remove(){},hidden:false,textContent:''},buttons=Array.from({length:18},()=>({pressed:false,value:0}));
 const pad={connected:true,mapping:'standard',buttons,axes:[0,0]};vi.stubGlobal('document',{hidden:false,hasFocus:()=>true,createElement:()=>status,querySelector:()=>({append(){}}),getElementById:()=>null});vi.stubGlobal('window',{addEventListener(){},removeEventListener(){}});vi.stubGlobal('navigator',{getGamepads:()=>[pad]});
 const input=new InputLatch(),actions:string[]=[],g=new GamepadInput(input,a=>{actions.push(a);input.clear();});buttons[7].pressed=true;g.poll(true);expect(input.snapshot().gas).toBe(true);buttons[9].pressed=true;g.poll(true);expect(actions).toEqual(['pause']);expect(input.snapshot().gas).toBe(false);g.poll(false);expect(actions).toEqual(['pause']);g.dispose();
});

it('accepts a fresh D-pad edge immediately after keyboard/mouse pause neutralization',()=>{
 const status={setAttribute(){},remove(){},hidden:false,textContent:''},buttons=Array.from({length:18},()=>({pressed:false,value:0})),pad={connected:true,mapping:'standard',buttons,axes:[0,0]};
 vi.stubGlobal('document',{hidden:false,hasFocus:()=>true,createElement:()=>status,querySelector:()=>({append(){}}),getElementById:()=>null});vi.stubGlobal('window',{addEventListener(){},removeEventListener(){}});vi.stubGlobal('navigator',{getGamepads:()=>[pad]});
 const actions:string[]=[],g=new GamepadInput(new InputLatch(),a=>actions.push(a));g.poll(true);g.neutralize();buttons[13].pressed=true;g.poll(false);expect(actions).toEqual(['down']);g.dispose();
});

it.each(['stick','confirm'] as const)('accepts a first exposed %s on the stage selector, including after reconnect',kind=>{
 const button={pressed:false,value:0};
 const pad={id:'PS4',index:0,connected:true,mapping:'standard',buttons:[button],axes:[0,0]};
 let visible=false;
 vi.stubGlobal('document',{hidden:false,hasFocus:()=>true,createElement:()=>({setAttribute(){},remove(){}}),querySelector:()=>({append(){}}),getElementById:()=>null});
 vi.stubGlobal('window',{addEventListener(){},removeEventListener(){}});
 vi.stubGlobal('navigator',{getGamepads:()=>visible?[pad]:[]});
 const actions:string[]=[],controller=new GamepadInput(new InputLatch(),a=>actions.push(a));
 controller.startStageMenu(null);
 const set=(on:boolean)=>{button.pressed=kind==='confirm'&&on;pad.axes[0]=kind==='stick'&&on?.85:0;};
 for(let i=0;i<2;i++){
  visible=false;controller.poll('stage-menu');
  set(true);visible=true;controller.poll('stage-menu');controller.poll('stage-menu');
  set(false);controller.poll('stage-menu');
 }
 expect(actions).toEqual(kind==='stick'?['right','right']:['confirm','confirm']);controller.dispose();
});
