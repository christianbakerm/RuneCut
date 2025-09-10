// systems/state.js
export function defaultState(){
  return {
    gold:0,
    wcXp:0, fishXp:0, minXp:0, smithXp:0, atkXp:0, strXp:0, defXp:0, smithXp:0, craftXp:0, cookXp:0,
    inventory:{},
    equipment:{
      axe:null, pick:null, weapon:null, shield:null,
      head:null, body:null, legs:null, gloves:null, boots:null,
      amulet:null, ring:null, cape:null
    },
    logs: [],
    logFilter: 'all',
    selectedTreeId:'oak',
    selectedSpotId:'pond_shallows',
    selectedRockId:'copper_rock',
    trainingStyle:'shared',
    action:null,
    combat:null,
    hpCurrent:null
  };
}
  
  export function saveState(state){
    localStorage.setItem('runecut-save', JSON.stringify(state));
  }
  
  export function loadState(){
    try{
      const raw = localStorage.getItem('runecut-save');
      if(!raw) return null;
      return JSON.parse(raw);
    }catch{return null;}
  }
  