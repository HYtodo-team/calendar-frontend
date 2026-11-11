import { useState } from 'react';
import { AxiosError } from 'axios';
import api from '../src/api/axios';
import { EventForm, TodoForm } from '../src/pages/home/Forms';
import { dateKey } from '../src/pages/home/calendar';
import '../src/index.css';
import '../src/pages/home/HomePage.css';
import './style.css';

// This entry point runs only in the separate development preview document.
let rejectNext = true;
api.defaults.adapter = async config => {
  const base = {config, headers: {}, statusText: 'OK'};
  if (rejectNext) {
    rejectNext = false;
    const field = config.url === '/todos' ? 'content' : 'title';
    throw new AxiosError('Validation', 'ERR_BAD_REQUEST', config, undefined, {...base, status:400, data:{
      success:false, errorCode:'VALIDATION_ERROR', message:'입력값을 확인해 주세요.', fieldErrors:[{field, message:'다른 내용으로 입력해 주세요.'}]
    }});
  }
  return {...base, status:201, data:{success:true, data:{id:1}}};
};

export default function Preview() {
  const [open, setOpen] = useState<'event'|'todo'|null>(null);
  const [result, setResult] = useState('');
  function start(kind: 'event'|'todo') { rejectNext = true; setResult(''); setOpen(kind); }
  function saved() { setOpen(null); setResult('다시 저장하기에 성공했어요. 예시 데이터는 보관하지 않아요.'); }
  return <main className="preview"><p className="tag">Planary · 개발용 미리보기</p>
    <h1>일정과 투두 입력 확인</h1><p>폼을 열고 내용을 입력한 뒤 저장해 보세요. 첫 요청에는 예시 오류가 표시됩니다. 입력값과 커서 위치를 확인하고 다시 저장해 보세요.</p>
    <div className="buttons"><button onClick={() => start('event')}>일정 작성</button><button onClick={() => start('todo')}>투두 작성</button></div>
    <p role="status">{result}</p><hr/><a href="/">Planary 사이트 열기 →</a><p className="note">이 페이지는 백엔드에 요청을 보내지 않습니다.</p>
    {open === 'event' && <EventForm date={dateKey(new Date())} onClose={() => setOpen(null)} onSaved={saved}/>}
    {open === 'todo' && <TodoForm events={[]} onClose={() => setOpen(null)} onSaved={saved}/>}
  </main>;
}
