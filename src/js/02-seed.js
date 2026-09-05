// ════════════════════════════════════════════════════════
// 2. SEED DATA
// ════════════════════════════════════════════════════════
const SEED = {
  version: 1, nextId: 300,
  settings: { theme: 'system', dismissedCarry: {} },
  weeks: [
    { ref:'2026-W33', wref:'W33', startDate:'2026-08-10', endDate:'2026-08-14', carriedFrom:null, tasks:[
      { id:100, rank:1, title:'Define Detection Pipeline architecture doc',   status:'done', nextMeeting:null, carried:false, expanded:false, subtasks:[{text:'Architecture review with platform team',link:null}] },
      { id:101, rank:2, title:'Q3 roadmap alignment with PM team',            status:'done', nextMeeting:null, carried:false, expanded:false, subtasks:[] },
      { id:102, rank:3, title:'HX reArchitecture in AWS — initial scoping',   status:'done', nextMeeting:null, carried:false, expanded:false, subtasks:[{text:'Scoping notes shared with engineering',link:null}] },
    ]},
    { ref:'2026-W34', wref:'W34', startDate:'2026-08-17', endDate:'2026-08-21', carriedFrom:null, tasks:[
      { id:1, rank:1, title:'Refine requirements for Unique Alert ID and Related stories', status:'done', nextMeeting:null, carried:false, expanded:true, subtasks:[
          {text:'SEC-209856 — UniqueID', link:'https://enterprisetools.atlassian.net/browse/SEC-209856'},
          {text:'SEC-218814 — TA',       link:'https://enterprisetools.atlassian.net/browse/SEC-218814'},
          {text:'SEC-218815 — FT',       link:'https://enterprisetools.atlassian.net/browse/SEC-218815'},
      ]},
      { id:2, rank:2, title:'Follow ML Detection Pipeline execution', status:'in-prog', nextMeeting:'2026-08-21T14:00', carried:false, expanded:true, subtasks:[
          {text:'Query side on Search Service',link:null},{text:'Snowflake — insertions',link:null},
      ]},
      { id:3, rank:3, title:'Bug: Huge number of duplicate traces (same traceid and time) in Snowflake', status:'in-prog', nextMeeting:null, carried:false, expanded:true, subtasks:[
          {text:'SEC-209763', link:'https://enterprisetools.atlassian.net/browse/SEC-209763'},
      ]},
      { id:4, rank:4, title:'Presentation to Joe — EDRF Layers Detection Pipeline', status:'todo', nextMeeting:'2026-08-20T10:00', carried:false, expanded:false, subtasks:[
          {text:'EDRF Layers Detection Pipeline and Response Flow', link:'https://enterprisetools.atlassian.net/wiki/spaces/SEC/pages/1316716556/'},
          {text:'Presentation slides', link:'https://docs.google.com/presentation/d/1yeAUIHOX4uGyzh9ZGlTmAp0x113xyEhaL-YutysvUWw/edit'},
      ]},
      { id:5, rank:5, title:'Work on AIDLC', status:'todo', nextMeeting:null, carried:false, expanded:false, subtasks:[
          {text:'AIDLC document',    link:'https://drive.google.com/file/d/1g2YXooxS7uxzenbwo6y0X0uBzNI_vOne/view'},
          {text:'Skills repository', link:'https://github.com/mattpocock/skills'},
      ]},
      { id:6, rank:6, title:'HX reArchitecture in AWS', status:'todo', nextMeeting:null, carried:false, expanded:false, subtasks:[] },
    ]},
    { ref:'2026-W35', wref:'W35', startDate:'2026-08-24', endDate:'2026-08-28', carriedFrom:'2026-W34', tasks:[
      { id:7, rank:1, title:'Bug: Huge number of duplicate traces (same traceid and time) in Snowflake', status:'in-prog', nextMeeting:'2026-08-26T15:00', carried:true, expanded:true, subtasks:[
          {text:'SEC-209763', link:'https://enterprisetools.atlassian.net/browse/SEC-209763'},
      ]},
      { id:8, rank:2, title:'Presentation to Joe — EDRF Layers Detection Pipeline', status:'todo', nextMeeting:'2026-08-27T10:00', carried:true, expanded:false, subtasks:[
          {text:'EDRF Layers Detection Pipeline and Response Flow', link:'https://enterprisetools.atlassian.net/wiki/spaces/SEC/pages/1316716556/'},
          {text:'Presentation slides', link:'https://docs.google.com/presentation/d/1yeAUIHOX4uGyzh9ZGlTmAp0x113xyEhaL-YutysvUWw/edit'},
      ]},
      { id:9, rank:3, title:'Work on AIDLC', status:'todo', nextMeeting:null, carried:true, expanded:false, subtasks:[
          {text:'AIDLC document',    link:'https://drive.google.com/file/d/1g2YXooxS7uxzenbwo6y0X0uBzNI_vOne/view'},
          {text:'Skills repository', link:'https://github.com/mattpocock/skills'},
      ]},
    ]},
    { ref:'2026-W36', wref:'W36', startDate:'2026-08-31', endDate:'2026-09-04', carriedFrom:null, tasks:[] },
  ]
};
