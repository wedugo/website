const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // <--- REPLACE THIS
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // <--- REPLACE THIS

const supabaseClient = (SUPABASE_URL.startsWith('http')) ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const game = new Chess();
let board = null, currentUser = null, currentProfile = { username: 'Guest', rating: 1500 };
let currentMatch = null, gameChannel = null, myColor = 'w', isMultiplayer = false;
let timeWhite = 600, timeBlack = 600, timerInterval = null;
const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 };
const PIECE_ICONS = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' };

function updateLichessMaterial() {
  const b = game.board();
  const counts = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };
  let wScore = 0, bScore = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = b[r][c];
      if (sq && sq.type !== 'k') {
        counts[sq.color][sq.type]++;
        if (sq.color === 'w') wScore += PIECE_VALUES[sq.type];
        else bScore += PIECE_VALUES[sq.type];
      }
    }
  }
  let wIcons = '', bIcons = '';
  ['q', 'r', 'b', 'n', 'p'].forEach(t => {
    const diff = counts.w[t] - counts.b[t];
    if (diff > 0) wIcons += PIECE_ICONS[t].repeat(diff);
    if (diff < 0) bIcons += PIECE_ICONS[t].repeat(Math.abs(diff));
  });
  const net = wScore - bScore;
  const wHtml = `${wIcons} ${net > 0 ? `<span class="score-pill">+${net}</span>` : ''}`;
  const bHtml = `${bIcons} ${net < 0 ? `<span class="score-pill">+${Math.abs(net)}</span>` : ''}`;
  if (board.orientation() === 'white') {
    document.getElementById('bottom-material').innerHTML = wHtml;
    document.getElementById('top-material').innerHTML = bHtml;
  } else {
    document.getElementById('bottom-material').innerHTML = bHtml;
    document.getElementById('top-material').innerHTML = wHtml;
  }
}

function onDragStart(source, piece) {
  if (game.game_over()) return false;
  if (isMultiplayer) {
    if (game.turn() !== myColor) return false;
    if ((myColor === 'w' && piece.startsWith('b')) || (myColor === 'b' && piece.startsWith('w'))) return false;
  } else {
    if ((game.turn() === 'w' && piece.startsWith('b')) || (game.turn() === 'b' && piece.startsWith('w'))) return false;
  }
}

function onDrop(source, target) {
  const move = game.move({ from: source, to: target, promotion: 'q' });
  if (move === null) return 'snapback';
  if (isMultiplayer && gameChannel) {
    gameChannel.send({ type: 'broadcast', event: 'move', payload: { move, timeWhite, timeBlack, fen: game.fen(), pgn: game.pgn() } });
  }
  afterMove();
}

function afterMove() {
  board.position(game.fen());
  updateLichessMaterial();
  updateStatus();
  startClock();
  document.getElementById('pgn-log').innerText = game.pgn() || 'No moves yet.';
  if (game.game_over() && isMultiplayer) {
    let winnerId = null, reason = 'Draw';
    if (game.in_checkmate()) {
      const winnerColor = game.turn() === 'w' ? 'b' : 'w';
      winnerId = winnerColor === 'w' ? currentMatch.white_id : currentMatch.black_id;
      reason = 'Checkmate';
    }
    concludeMultiplayerMatch(winnerId, reason);
  }
}

function updateStatus() {
  const turnName = game.turn() === 'w' ? 'White' : 'Black';
  let text = `${turnName} to move`;
  if (game.in_checkmate()) text = `Checkmate! ${turnName === 'White' ? 'Black' : 'White'} wins!`;
  else if (game.in_draw()) text = 'Game Over • Draw!';
  else if (game.in_check()) text += ' (Check!)';
  document.getElementById('game-status').innerText = text;
}

function formatSec(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function renderClocks() {
  if(!board) return;
  const whiteBottom = board.orientation() === 'white';
  const bEl = document.getElementById('bottom-clock');
  const tEl = document.getElementById('top-clock');
  const bTime = whiteBottom ? timeWhite : timeBlack;
  const tTime = whiteBottom ? timeBlack : timeWhite;
  bEl.innerText = formatSec(bTime);
  tEl.innerText = formatSec(tTime);
  const wTurn = game.turn() === 'w';
  bEl.classList.toggle('active', whiteBottom ? wTurn : !wTurn);
  tEl.classList.toggle('active', whiteBottom ? !wTurn : wTurn);
  bEl.classList.toggle('low', bTime < 30);
  tEl.classList.toggle('low', tTime < 30);
}

function startClock() {
  if (timerInterval) clearInterval(timerInterval);
  renderClocks();
  timerInterval = setInterval(() => {
    if (game.game_over()) return clearInterval(timerInterval);
    if (game.turn() === 'w') {
      timeWhite = Math.max(0, timeWhite - 1);
      if (timeWhite === 0) handleFlagFall('b');
    } else {
      timeBlack = Math.max(0, timeBlack - 1);
      if (timeBlack === 0) handleFlagFall('w');
    }
    renderClocks();
  }, 1000);
}

function handleFlagFall(winnerColor) {
  clearInterval(timerInterval);
  const wName = winnerColor === 'w' ? 'White' : 'Black';
  document.getElementById('game-status').innerText = `Time out! ${wName} wins on time.`;
  if (isMultiplayer && currentMatch) {
    const winnerId = winnerColor === 'w' ? currentMatch.white_id : currentMatch.black_id;
    concludeMultiplayerMatch(winnerId, 'Time forfeit');
  }
}

async function initSupabaseSession() {
  if (!supabaseClient) {
    document.getElementById('user-display').innerText = 'Offline Demo Mode (Add Supabase Keys)';
    return;
  }
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    await ensureUserProfile();
  } else {
    document.getElementById('user-display').innerText = 'Guest (Login to play rated)';
  }
  loadOpenLobby();
  loadLeaderboard();
  subscribeLobbyChanges();
}

async function ensureUserProfile() {
  if(!supabaseClient) return;
  let { data: prof } = await supabaseClient.from('chess_profiles').select('*').eq('id', currentUser.id).single();
  if (!prof) {
    const defaultName = currentUser.email ? currentUser.email.split('@')[0] : 'Player';
    const { data: created } = await supabaseClient.from('chess_profiles').insert([{ id: currentUser.id, username: defaultName, rating: 1500 }]).select().single();
    prof = created || { username: defaultName, rating: 1500 };
  }
  currentProfile = prof;
  document.getElementById('user-display').innerText = prof.username;
  document.getElementById('user-rating').innerText = `${prof.rating}`;
  document.getElementById('auth-btn').innerText = 'Logout';
  document.getElementById('auth-btn').onclick = async () => { await supabaseClient.auth.signOut(); location.reload(); };
}

async function findOrCreateMatch(seconds) {
  if (!supabaseClient || !currentUser) {
    alert('Please Login first!');
    openAuthModal();
    return;
  }
  document.getElementById('game-status').innerText = 'Searching for opponent...';
  const { data: waiting } = await supabaseClient.from('chess_matches').select('*').eq('status', 'waiting').eq('time_control', seconds).neq('white_id', currentUser.id).limit(1).maybeSingle();
  if (waiting) {
    joinWaitingMatch(waiting.id);
  } else {
    const { data: created } = await supabaseClient.from('chess_matches').insert([{ white_id: currentUser.id, white_name: currentProfile.username, white_rating: currentProfile.rating, time_control: seconds, status: 'waiting' }]).select().single();
    if (created) {
      setupMatchRoom(created, 'w');
      document.getElementById('game-status').innerText = 'Waiting for opponent...';
    }
  }
}

async function joinWaitingMatch(matchId) {
  if (!currentUser) return openAuthModal();
  if (!supabaseClient) return;
  const { data: joined } = await supabaseClient.from('chess_matches').update({ black_id: currentUser.id, black_name: currentProfile.username, black_rating: currentProfile.rating, status: 'playing' }).eq('id', matchId).select().single();
  if (joined) {
    setupMatchRoom(joined, 'b');
    gameChannel.send({ type: 'broadcast', event: 'match_started', payload: { match: joined } });
  }
}

function setupMatchRoom(matchObj, assignedColor) {
  currentMatch = matchObj;
  myColor = assignedColor;
  isMultiplayer = true;
  game.reset();
  timeWhite = matchObj.time_control;
  timeBlack = matchObj.time_control;
  board.orientation(myColor === 'w' ? 'white' : 'black');
  board.start();
  updateLichessMaterial();
  renderClocks();
  document.getElementById('btn-resign').disabled = false;
  document.getElementById('btn-draw').disabled = false;
  updatePlayerHeaders(matchObj);
  
  if (!supabaseClient) return;
  if (gameChannel) supabaseClient.removeChannel(gameChannel);
  
  gameChannel = supabaseClient.channel(`room_${matchObj.id}`, { config: { broadcast: { self: false } } });
  gameChannel
    .on('broadcast', { event: 'match_started' }, ({ payload }) => {
      currentMatch = payload.match;
      updatePlayerHeaders(currentMatch);
      document.getElementById('game-status').innerText = 'Connected! White to move.';
      startClock();
    })
    .on('broadcast', { event: 'move' }, ({ payload }) => {
      game.move(payload.move);
      timeWhite = payload.timeWhite;
      timeBlack = payload.timeBlack;
      afterMove();
    })
    .on('broadcast', { event: 'chat' }, ({ payload }) => { appendChat(payload.sender, payload.text); })
    .on('broadcast', { event: 'game_action' }, ({ payload }) => {
      if (payload.action === 'resign') {
        clearInterval(timerInterval);
        document.getElementById('game-status').innerText = `${payload.user} resigned! You win!`;
      } else if (payload.action === 'draw_offer') {
        if (confirm(`${payload.user} offered a draw. Accept?`)) {
          gameChannel.send({ type: 'broadcast', event: 'game_action', payload: { action: 'draw_accepted' } });
          concludeMultiplayerMatch(null, 'Mutual Draw');
        }
      } else if (payload.action === 'draw_accepted') {
        concludeMultiplayerMatch(null, 'Mutual Draw');
      }
    })
    .subscribe();
}

function updatePlayerHeaders(m) {
  const wLabel = `${m.white_name || 'White'} (${m.white_rating || 1500})`;
  const bLabel = `${m.black_name || 'Waiting...'} (${m.black_rating || '?'})`;
  if (myColor === 'w') {
    document.getElementById('bottom-name').innerText = wLabel;
    document.getElementById('top-name').innerText = bLabel;
  } else {
    document.getElementById('bottom-name').innerText = bLabel;
    document.getElementById('top-name').innerText = wLabel;
  }
}

async function concludeMultiplayerMatch(winnerId, reason) {
  clearInterval(timerInterval);
  isMultiplayer = false;
  document.getElementById('btn-resign').disabled = true;
  document.getElementById('btn-draw').disabled = true;
  document.getElementById('game-status').innerText = `Game Over (${reason})`;
  if (!supabaseClient || !currentMatch) return;
  await supabaseClient.from('chess_matches').update({ status: 'finished', winner_id: winnerId, result_reason: reason, pgn: game.pgn(), fen: game.fen() }).eq('id', currentMatch.id);
  
  if (winnerId && currentUser.id === winnerId) {
    const newRating = currentProfile.rating + 12;
    await supabaseClient.from('chess_profiles').update({ rating: newRating, wins: (currentProfile.wins || 0) + 1 }).eq('id', currentUser.id);
    currentProfile.rating = newRating;
    document.getElementById('user-rating').innerText = newRating;
  } else if (winnerId && currentUser.id !== winnerId) {
    const newRating = Math.max(800, currentProfile.rating - 12);
    await supabaseClient.from('chess_profiles').update({ rating: newRating, losses: (currentProfile.losses || 0) + 1 }).eq('id', currentUser.id);
    currentProfile.rating = newRating;
    document.getElementById('user-rating').innerText = newRating;
  }
  loadLeaderboard();
}

async function loadOpenLobby() {
  if (!supabaseClient) return;
  const { data } = await supabaseClient.from('chess_matches').select('*').eq('status', 'waiting').order('created_at', { ascending: false }).limit(8);
  const ul = document.getElementById('open-lobby-list');
  if (!data || data.length === 0) {
    ul.innerHTML = '<li class="list-item">No waiting challenges.</li>';
    return;
  }
  ul.innerHTML = data.map(m => `
    <li class="list-item">
      <span><strong>${m.white_name}</strong> (${m.white_rating}) • ${m.time_control / 60}+0</span>
      ${currentUser && m.white_id === currentUser.id ? '<small>Your lobby</small>' : `<button onclick="joinWaitingMatch('${m.id}')">Accept</button>`}
    </li>
  `).join('');
}

async function loadLeaderboard() {
  if (!supabaseClient) return;
  const { data } = await supabaseClient.from('chess_profiles').select('username, rating, wins').order('rating', { ascending: false }).limit(10);
  const ul = document.getElementById('leaderboard-list');
  if (!data || data.length === 0) return;
  ul.innerHTML = data.map((p, idx) => `
    <li class="list-item">
      <span>#${idx + 1} <strong>${p.username}</strong></span>
      <span class="badge-rating">${p.rating}</span>
    </li>
  `).join('');
}

function subscribeLobbyChanges() {
  if (!supabaseClient) return;
  supabaseClient.channel('public:chess_matches').on('postgres_changes', { event: '*', schema: 'public', table: 'chess_matches' }, () => { loadOpenLobby(); }).subscribe();
}

function sendChat() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  const sender = currentProfile.username || 'Player';
  appendChat('You', text);
  if (gameChannel) gameChannel.send({ type: 'broadcast', event: 'chat', payload: { sender, text } });
}

function appendChat(sender, text) {
  const box = document.getElementById('chat-log');
  const d = document.createElement('div');
  d.innerHTML = `<strong>${sender}:</strong> ${text}`;
  box.appendChild(d);
  box.scrollTop = box.scrollHeight;
}

function resignGame() {
  if (!isMultiplayer || !currentMatch) return;
  if (!confirm('Are you sure you want to resign?')) return;
  gameChannel.send({ type: 'broadcast', event: 'game_action', payload: { action: 'resign', user: currentProfile.username } });
  const winnerId = myColor === 'w' ? currentMatch.black_id : currentMatch.white_id;
  concludeMultiplayerMatch(winnerId, 'Resignation');
}

function offerDraw() {
  if (!isMultiplayer || !gameChannel) return;
  gameChannel.send({ type: 'broadcast', event: 'game_action', payload: { action: 'draw_offer', user: currentProfile.username } });
  appendChat('System', 'Draw offer sent.');
}

function playVsComputer() {
  isMultiplayer = false;
  game.reset();
  timeWhite = 600;
  timeBlack = 600;
  board.start();
  updateLichessMaterial();
  renderClocks();
  document.getElementById('game-status').innerText = 'Solo / Pass & Play mode active.';
}

function flipBoard() { board.flip(); updateLichessMaterial(); renderClocks(); }
function openAuthModal() { document.getElementById('auth-modal').style.display = 'flex'; }
function closeAuthModal() { document.getElementById('auth-modal').style.display = 'none'; }

async function handleLogin() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-pass').value.trim();
  if (!supabaseClient) return alert('Supabase not configured');
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);
  closeAuthModal();
  location.reload();
}

async function handleSignup() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-pass').value.trim();
  const username = document.getElementById('auth-username').value.trim() || email.split('@')[0];
  if (!supabaseClient) return alert('Supabase not configured');
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) return alert(error.message);
  if (data?.user) {
    await supabaseClient.from('chess_profiles').insert([{ id: data.user.id, username, rating: 1500 }]);
  }
  alert('Account ready!');
  closeAuthModal();
  location.reload();
}

board = Chessboard('myBoard', {
  draggable: true,
  position: 'start',
  pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
  onDragStart,
  onDrop,
  onSnapEnd: () => board.position(game.fen())
});

updateLichessMaterial();
renderClocks();
initSupabaseSession();
window.addEventListener('resize', () => board.resize());
