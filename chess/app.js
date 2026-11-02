const SUPABASE_URL = 'https://cncahdezxttujjzihozt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuY2FoZGV6eHR0dWpqemlob3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzOTI2MjgsImV4cCI6MjEwNDk2ODYyOH0.69WvQ73HHJvTiKlRkMdACgxMVLj4prcLMhRhRfTfW_0';

const supabaseClient = (SUPABASE_URL.startsWith('http')) ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const game = new Chess();

// Persistent Guest Identity so Guests never need Login to play or cancel their own lobbies
let guestToken = localStorage.getItem('wedugo_guest_token');
if (!guestToken) {
  guestToken = 'guest_' + Math.random().toString(36).substring(2, 7);
  localStorage.setItem('wedugo_guest_token', guestToken);
}
const guestDisplayName = 'Guest-' + guestToken.split('_')[1].toUpperCase();

let board = null;
let currentUser = null;
let currentProfile = { username: guestDisplayName, rating: 1500 };
let currentMatch = null;
let gameChannel = null;
let myColor = 'w';
let isMultiplayer = false;
let isSpectator = false;
let vsAiBot = false;

// Clocks & Increments
let timeWhite = 600;
let timeBlack = 600;
let currentIncrement = 0;
let timerInterval = null;

// Lichess Move State
let selectedSquare = null;
let pendingPromotion = null;
let lastMoveSquares = [];

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 };
const PIECE_ICONS = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' };

// ==========================================
// 1. SYNTHESIZED CHESS SOUND EFFECTS (Web Audio API)
// ==========================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
  const chkSound = document.getElementById('chk-sound');
  if (chkSound && !chkSound.checked) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    if (type === 'move') {
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
      osc.start(now);
      osc.stop(now + 0.07);
    } else if (type === 'capture') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);
      osc.start(now);
      osc.stop(now + 0.11);
    } else if (type === 'check') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(520, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'end') {
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.setValueAtTime(520, now + 0.12);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) {}
}

// ==========================================
// 2. LICHESS CLICK-TO-MOVE & LEGAL DOTS
// ==========================================
function clearSelection() {
  selectedSquare = null;
  $('#myBoard .square-55d63').removeClass('highlight-selected legal-move-dot legal-capture-ring');
}

function updateBoardHighlights() {
  $('#myBoard .square-55d63').removeClass('highlight-last highlight-check');

  // Highlight Last Move
  lastMoveSquares.forEach(sq => {
    $('#myBoard .square-' + sq).addClass('highlight-last');
  });

  // Highlight King in Check
  if (game.in_check()) {
    const turnColor = game.turn();
    const b = game.board();
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = b[r][c];
        if (piece && piece.type === 'k' && piece.color === turnColor) {
          const kingSq = files[c] + (8 - r);
          $('#myBoard .square-' + kingSq).addClass('highlight-check');
        }
      }
    }
  }
}

function showLegalMovesForSquare(square) {
  clearSelection();
  selectedSquare = square;
  $('#myBoard .square-' + square).addClass('highlight-selected');

  const showDots = document.getElementById('chk-legal-dots')?.checked;
  if (!showDots) return;

  const moves = game.moves({ square: square, verbose: true });
  moves.forEach(m => {
    const targetEl = $('#myBoard .square-' + m.to);
    if (m.captured || m.flags.includes('e')) {
      targetEl.addClass('legal-capture-ring');
    } else {
      targetEl.addClass('legal-move-dot');
    }
  });
}

function isPromotionMove(fromSq, toSq) {
  const piece = game.get(fromSq);
  if (!piece || piece.type !== 'p') return false;
  if (piece.color === 'w' && toSq[1] === '8') return true;
  if (piece.color === 'b' && toSq[1] === '1') return true;
  return false;
}

function attemptMove(fromSq, toSq) {
  // Verify move legality first
  const legalMoves = game.moves({ square: fromSq, verbose: true });
  const isLegal = legalMoves.some(m => m.to === toSq);
  if (!isLegal) return false;

  const autoQueen = document.getElementById('chk-auto-queen')?.checked;
  if (isPromotionMove(fromSq, toSq) && !autoQueen) {
    pendingPromotion = { from: fromSq, to: toSq };
    document.getElementById('promo-modal').style.display = 'flex';
    return true;
  }

  executeMove(fromSq, toSq, 'q');
  return true;
}

function completePromotion(pieceType) {
  document.getElementById('promo-modal').style.display = 'none';
  if (!pendingPromotion) return;
  executeMove(pendingPromotion.from, pendingPromotion.to, pieceType);
  pendingPromotion = null;
}

function executeMove(fromSq, toSq, promoPiece = 'q') {
  const move = game.move({ from: fromSq, to: toSq, promotion: promoPiece });
  if (!move) return;

  clearSelection();
  lastMoveSquares = [move.from, move.to];

  // Add FIDE Increment
  if (isMultiplayer) {
    if (myColor === 'w') timeWhite += currentIncrement;
    else if (myColor === 'b') timeBlack += currentIncrement;

    if (gameChannel) {
      gameChannel.send({
        type: 'broadcast',
        event: 'move',
        payload: { move, timeWhite, timeBlack, fen: game.fen(), pgn: game.pgn() }
      });
    }
    // Persist live state to Supabase so spectators joining mid-game see current board
    if (supabaseClient && currentMatch) {
      supabaseClient.from('chess_matches').update({ fen: game.fen(), pgn: game.pgn() }).eq('id', currentMatch.id).then();
    }
  }

  afterMove(move);

  // If playing vs AI Bot
  if (!isMultiplayer && vsAiBot && !game.game_over() && game.turn() === 'b') {
    setTimeout(makeAiBotMove, 350);
  }
}

// Click-to-Move Event Handler
$(document).on('click', '#myBoard .square-55d63', function () {
  const clickEnabled = document.getElementById('chk-click-move')?.checked;
  if (!clickEnabled) return;
  if (game.game_over() || isSpectator) return;

  if (isMultiplayer && game.turn() !== myColor) return;
  if (!isMultiplayer && vsAiBot && game.turn() === 'b') return;

  const clickedSq = $(this).attr('data-square');
  const clickedPiece = game.get(clickedSq);

  if (selectedSquare === null) {
    if (clickedPiece && clickedPiece.color === game.turn()) {
      showLegalMovesForSquare(clickedSq);
    }
  } else {
    if (clickedSq === selectedSquare) {
      clearSelection();
      return;
    }
    // Try executing move to clicked square
    const moved = attemptMove(selectedSquare, clickedSq);
    if (!moved) {
      // If clicked another friendly piece, switch selection immediately
      if (clickedPiece && clickedPiece.color === game.turn()) {
        showLegalMovesForSquare(clickedSq);
      } else {
        clearSelection();
      }
    }
  }
});

// Drag-and-Drop Handlers (When user toggles Drag mode or drags directly)
function onDragStart(source, piece) {
  if (game.game_over() || isSpectator) return false;
  if (isMultiplayer) {
    if (game.turn() !== myColor) return false;
    if ((myColor === 'w' && piece.startsWith('b')) || (myColor === 'b' && piece.startsWith('w'))) return false;
  } else {
    if (vsAiBot && game.turn() === 'b') return false;
    if ((game.turn() === 'w' && piece.startsWith('b')) || (game.turn() === 'b' && piece.startsWith('w'))) return false;
  }
  showLegalMovesForSquare(source);
}

function onDrop(source, target) {
  if (source === target) return 'snapback';
  const success = attemptMove(source, target);
  if (!success) return 'snapback';
}

function toggleMoveMode() {
  const isClickMode = document.getElementById('chk-click-move').checked;
  const currentFen = game.fen();
  const currentOrient = board ? board.orientation() : 'white';
  clearSelection();

  board = Chessboard('myBoard', {
    draggable: !isClickMode,
    position: currentFen,
    orientation: currentOrient,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: () => board.position(game.fen())
  });
  updateBoardHighlights();
}

// ==========================================
// 3. SMART AI BOT (FOR OFFLINE PRACTICE)
// ==========================================
function makeAiBotMove() {
  if (game.game_over()) return;
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return;

  // Prioritize captures & checks
  let bestMove = moves[Math.floor(Math.random() * moves.length)];
  let bestScore = -1;
  moves.forEach(m => {
    let score = Math.random() * 0.5;
    if (m.captured) score += (PIECE_VALUES[m.captured] || 1) * 2;
    if (m.san.includes('+')) score += 1.5;
    if (score > bestScore) {
      bestScore = score;
      bestMove = m;
    }
  });

  const move = game.move(bestMove);
  if (move) {
    lastMoveSquares = [move.from, move.to];
    afterMove(move);
  }
}

// ==========================================
// 4. MATERIAL, MOVE TABLE & CLOCKS
// ==========================================
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
  if (board && board.orientation() === 'white') {
    document.getElementById('bottom-material').innerHTML = wHtml;
    document.getElementById('top-material').innerHTML = bHtml;
  } else {
    document.getElementById('bottom-material').innerHTML = bHtml;
    document.getElementById('top-material').innerHTML = wHtml;
  }
}

function renderMoveTable() {
  const history = game.history();
  const tbody = document.getElementById('pgn-tbody');
  if (!tbody) return;
  if (history.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="color:#777; padding:8px;">1. Move history will appear here...</td></tr>';
    return;
  }
  let html = '';
  for (let i = 0; i < history.length; i += 2) {
    const moveNum = Math.floor(i / 2) + 1;
    const whiteMove = history[i] || '';
    const blackMove = history[i + 1] || '';
    html += `<tr>
      <td class="move-num">${moveNum}.</td>
      <td class="move-ply">${whiteMove}</td>
      <td class="move-ply">${blackMove}</td>
    </tr>`;
  }
  tbody.innerHTML = html;
  const wrap = document.getElementById('moves-wrap');
  if (wrap) wrap.scrollTop = wrap.scrollHeight;
}

function afterMove(moveObj) {
  board.position(game.fen());
  updateBoardHighlights();
  updateLichessMaterial();
  renderMoveTable();
  updateStatus();
  startClock();

  if (game.in_checkmate() || game.in_draw()) {
    playSound('end');
  } else if (game.in_check()) {
    playSound('check');
  } else if (moveObj && moveObj.captured) {
    playSound('capture');
  } else {
    playSound('move');
  }

  if (game.game_over() && isMultiplayer && !isSpectator) {
    let winnerId = null, reason = 'Draw';
    if (game.in_checkmate()) {
      const winnerColor = game.turn() === 'w' ? 'b' : 'w';
      winnerId = winnerColor === 'w' ? currentMatch.white_id : currentMatch.black_id;
      reason = `Checkmate (${winnerColor === 'w' ? 'White' : 'Black'} wins)`;
    } else if (game.in_stalemate()) {
      reason = 'Stalemate Draw';
    } else if (game.in_threefold_repetition()) {
      reason = 'Threefold Repetition Draw';
    } else if (game.insufficient_material()) {
      reason = 'Insufficient Material Draw';
    }
    concludeMultiplayerMatch(winnerId, reason);
  }
}

function updateStatus() {
  const turnName = game.turn() === 'w' ? 'White' : 'Black';
  let text = `${turnName} to move`;
  if (game.in_checkmate()) text = `🏆 Checkmate! ${turnName === 'White' ? 'Black' : 'White'} wins!`;
  else if (game.in_stalemate()) text = '½-½ Draw by Stalemate!';
  else if (game.in_threefold_repetition()) text = '½-½ Draw by Repetition!';
  else if (game.insufficient_material()) text = '½-½ Draw by Insufficient Material!';
  else if (game.in_draw()) text = '½-½ Game Over • Draw!';
  else if (game.in_check()) text += ' ⚠️ (Check!)';

  if (isSpectator) text = `👁️ Spectating • ` + text;
  document.getElementById('game-status').innerText = text;
}

function formatSec(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function renderClocks() {
  if (!board) return;
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
      if (timeWhite === 0 && !isSpectator) handleFlagFall('b');
    } else {
      timeBlack = Math.max(0, timeBlack - 1);
      if (timeBlack === 0 && !isSpectator) handleFlagFall('w');
    }
    renderClocks();
  }, 1000);
}

function handleFlagFall(winnerColor) {
  clearInterval(timerInterval);
  playSound('end');
  const wName = winnerColor === 'w' ? 'White' : 'Black';
  document.getElementById('game-status').innerText = `⏰ Time out! ${wName} wins on time.`;
  if (isMultiplayer && currentMatch && !isSpectator) {
    const winnerId = winnerColor === 'w' ? currentMatch.white_id : currentMatch.black_id;
    concludeMultiplayerMatch(winnerId, `${wName} won on time`);
  }
}

// ==========================================
// 5. SUPABASE SESSION & 100% GUEST MULTIPLAYER
// ==========================================
function encodeMatchMeta(inc) {
  return `inc:${inc}|gt:${guestToken}`;
}

function parseMatchMeta(reasonStr) {
  let inc = 0, gt = '';
  if (reasonStr && reasonStr.includes('inc:')) {
    const parts = reasonStr.split('|');
    parts.forEach(p => {
      if (p.startsWith('inc:')) inc = parseInt(p.split(':')[1]) || 0;
      if (p.startsWith('gt:')) gt = p.split(':')[1] || '';
    });
  }
  return { inc, gt };
}

function isMatchCreatedByMe(matchObj) {
  if (currentUser && matchObj.white_id === currentUser.id) return true;
  const meta = parseMatchMeta(matchObj.result_reason);
  if (meta.gt && meta.gt === guestToken) return true;
  return false;
}

async function initSupabaseSession() {
  if (!supabaseClient) return;
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    await ensureUserProfile();
  } else {
    document.getElementById('user-display').innerText = `${guestDisplayName} (Free Play)`;
  }
  loadOpenLobby();
  loadLiveMatches();
  loadLeaderboard();
  subscribeLobbyChanges();
  checkUrlForMatch();
}

async function ensureUserProfile() {
  if (!supabaseClient || !currentUser) return;
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
  document.getElementById('auth-btn').onclick = async () => {
    await supabaseClient.auth.signOut();
    location.reload();
  };
}

// Create Invite Link (Works for both Guests & Logged in Users)
async function createInviteLink() {
  if (!supabaseClient) return;
  document.getElementById('game-status').innerText = 'Creating invite link & Match ID...';
  currentIncrement = 0;

  const hostName = currentUser ? currentProfile.username : guestDisplayName;
  const hostId = currentUser ? currentUser.id : null;
  const hostRating = currentUser ? currentProfile.rating : 1500;

  const { data: created, error } = await supabaseClient.from('chess_matches').insert([{
    white_id: hostId,
    white_name: hostName,
    white_rating: hostRating,
    time_control: 600,
    status: 'waiting',
    result_reason: encodeMatchMeta(0)
  }]).select().single();

  if (error || !created) {
    document.getElementById('game-status').innerHTML = '<span style="color:#ff8080;">Database Error: Check Supabase table permissions.</span>';
    return;
  }

  const inviteUrl = window.location.origin + window.location.pathname + '?match=' + created.id;
  document.getElementById('game-status').innerHTML = `
    <strong>✅ Match Created! Click to Copy ID or Link:</strong><br>
    <div style="display:flex; gap:6px; margin-top:6px;">
      <input type="text" value="${created.id}" readonly onclick="copyMatchId('${created.id}')" style="background:#111; color:#629924; font-weight:bold; cursor:pointer;" title="Click to copy Match ID">
      <button onclick="copyMatchId('${inviteUrl}')">Copy Link</button>
    </div>
  `;
  setupMatchRoom(created, 'w');
  loadOpenLobby();
}

// Join Match by Pasting Full Link, Full UUID, or Short 6-char ID
async function joinFromInput() {
  if (!supabaseClient) return;
  const val = document.getElementById('join-link-input').value.trim();
  if (!val) {
    document.getElementById('game-status').innerText = '⚠️ Please paste a Match ID or Invite Link first.';
    return;
  }

  let matchId = val;
  if (val.includes('?match=')) {
    matchId = val.split('?match=')[1].split('&')[0];
  }
  matchId = matchId.replace('#', '').trim();

  document.getElementById('game-status').innerText = `Connecting to match ${matchId.substring(0, 8)}...`;

  // Support both full UUID and short prefix ID
  let query = supabaseClient.from('chess_matches').select('*');
  if (matchId.length === 36) {
    query = query.eq('id', matchId);
  } else {
    query = query.ilike('id', `${matchId}%`);
  }

  const { data: matches } = await query.limit(1);
  const targetMatch = matches && matches[0];

  if (!targetMatch) {
    document.getElementById('game-status').innerText = '❌ Match ID not found.';
    return;
  }

  document.getElementById('join-link-input').value = '';
  const meta = parseMatchMeta(targetMatch.result_reason);

  if (targetMatch.status === 'waiting') {
    await joinWaitingMatch(targetMatch.id, meta.inc);
  } else if (targetMatch.status === 'playing') {
    await spectateMatch(targetMatch.id);
  } else {
    document.getElementById('game-status').innerText = '⚠️ This match has already finished.';
  }
}

async function checkUrlForMatch() {
  const params = new URLSearchParams(window.location.search);
  const matchId = params.get('match');
  if (matchId && supabaseClient) {
    document.getElementById('join-link-input').value = matchId;
    await joinFromInput();
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// Quick Public Pairing (Guests & Logged In Users Can Pair Together Freely!)
async function findOrCreateMatch(seconds, incrementSeconds) {
  if (!supabaseClient) return;
  currentIncrement = incrementSeconds;
  document.getElementById('game-status').innerText = `Searching for ${seconds / 60}+${incrementSeconds} opponent...`;

  const myId = currentUser ? currentUser.id : null;
  const myName = currentUser ? currentProfile.username : guestDisplayName;
  const myRating = currentUser ? currentProfile.rating : 1500;

  // Fetch waiting matches with same time control
  const { data: waitingList } = await supabaseClient
    .from('chess_matches')
    .select('*')
    .eq('status', 'waiting')
    .eq('time_control', seconds)
    .order('created_at', { ascending: true });

  // Find first opponent match that was NOT created by this same user/guest
  let opponentMatch = null;
  if (waitingList && waitingList.length > 0) {
    opponentMatch = waitingList.find(m => {
      const meta = parseMatchMeta(m.result_reason);
      return !isMatchCreatedByMe(m) && meta.inc === incrementSeconds;
    });
  }

  if (opponentMatch) {
    await joinWaitingMatch(opponentMatch.id, incrementSeconds);
  } else {
    // Check if I already have a waiting lobby open
    const myExisting = (waitingList || []).find(m => isMatchCreatedByMe(m));
    if (myExisting) {
      setupMatchRoom(myExisting, 'w');
      document.getElementById('game-status').innerText = `Waiting in your open lobby (#${myExisting.id.substring(0, 6)})...`;
      return;
    }

    // Create a new public lobby
    const { data: created } = await supabaseClient.from('chess_matches').insert([{
      white_id: myId,
      white_name: myName,
      white_rating: myRating,
      time_control: seconds,
      status: 'waiting',
      result_reason: encodeMatchMeta(incrementSeconds)
    }]).select().single();

    if (created) {
      setupMatchRoom(created, 'w');
      document.getElementById('game-status').innerText = `Lobby #${created.id.substring(0, 6)} (${seconds / 60}+${incrementSeconds}) created! Waiting for opponent...`;
      loadOpenLobby();
    }
  }
}

// Direct Play without any Login Popup!
async function joinWaitingMatch(matchId, incrementSeconds = 0) {
  if (!supabaseClient) return;
  currentIncrement = incrementSeconds;

  const myName = currentUser ? currentProfile.username : guestDisplayName;
  const myRating = currentUser ? currentProfile.rating : 1500;
  const myId = currentUser ? currentUser.id : null;

  const { data: joined, error } = await supabaseClient
    .from('chess_matches')
    .update({
      black_id: myId,
      black_name: myName,
      black_rating: myRating,
      status: 'playing',
      result_reason: `inc:${incrementSeconds}`
    })
    .eq('id', matchId)
    .eq('status', 'waiting')
    .select()
    .single();

  if (error || !joined) {
    document.getElementById('game-status').innerText = '⚠️ Match was already accepted or cancelled.';
    loadOpenLobby();
    return;
  }

  setupMatchRoom(joined, 'b', () => {
    gameChannel.send({ type: 'broadcast', event: 'match_started', payload: { match: joined } });
  });
  loadOpenLobby();
  loadLiveMatches();
}

async function cancelLobby(matchId) {
  if (!supabaseClient) return;
  await supabaseClient.from('chess_matches').delete().eq('id', matchId);
  loadOpenLobby();
  if (currentMatch && currentMatch.id === matchId) {
    playVsComputer(false);
    document.getElementById('game-status').innerText = 'Lobby cancelled.';
  }
}

async function clearMyWaitingLobbies() {
  if (!supabaseClient) return;
  const { data } = await supabaseClient.from('chess_matches').select('*').eq('status', 'waiting');
  if (data && data.length > 0) {
    const myIds = data.filter(m => isMatchCreatedByMe(m)).map(m => m.id);
    for (const id of myIds) {
      await supabaseClient.from('chess_matches').delete().eq('id', id);
    }
  }
  loadOpenLobby();
  document.getElementById('game-status').innerText = 'Your waiting lobbies have been cleared.';
}

async function spectateMatch(matchId) {
  if (!supabaseClient) return;
  const { data: match } = await supabaseClient.from('chess_matches').select('*').eq('id', matchId).single();
  if (match) {
    setupMatchRoom(match, 'spectator');
  }
}

// ==========================================
// 6. REALTIME ROOM, TAKEBACK & REMATCH
// ==========================================
function setupMatchRoom(matchObj, assignedColor, onSubscribedCallback = null) {
  currentMatch = matchObj;
  myColor = assignedColor;
  isMultiplayer = true;
  isSpectator = (myColor === 'spectator');
  vsAiBot = false;

  game.reset();
  clearSelection();
  lastMoveSquares = [];

  if (matchObj.pgn) {
    game.load_pgn(matchObj.pgn);
  } else if (matchObj.fen && matchObj.fen !== 'start') {
    game.load(matchObj.fen);
  }

  timeWhite = matchObj.time_control || 600;
  timeBlack = matchObj.time_control || 600;

  const meta = parseMatchMeta(matchObj.result_reason);
  currentIncrement = meta.inc;

  board.orientation(myColor === 'b' ? 'black' : 'white');
  board.position(game.fen());

  updateBoardHighlights();
  updateLichessMaterial();
  renderMoveTable();
  renderClocks();

  document.getElementById('active-match-badge').innerText = `Match #${matchObj.id.substring(0, 6)} (${matchObj.time_control / 60}+${currentIncrement})`;
  document.getElementById('btn-rematch').style.display = 'none';

  if (isSpectator) {
    document.getElementById('btn-resign').disabled = true;
    document.getElementById('btn-draw').disabled = true;
    document.getElementById('btn-takeback').disabled = true;
    document.getElementById('game-status').innerText = `👁️ Spectating #${matchObj.id.substring(0, 6)}: ${matchObj.white_name} vs ${matchObj.black_name}`;
    if (matchObj.status === 'playing') startClock();
  } else {
    document.getElementById('btn-resign').disabled = false;
    document.getElementById('btn-draw').disabled = false;
    document.getElementById('btn-takeback').disabled = false;
    if (matchObj.status === 'playing') {
      document.getElementById('game-status').innerText = `⚔️ Match Started! You play ${myColor === 'w' ? 'White' : 'Black'}. White to move.`;
      playSound('move');
      startClock();
    }
  }

  updatePlayerHeaders(matchObj);

  if (!supabaseClient) return;
  if (gameChannel) supabaseClient.removeChannel(gameChannel);

  gameChannel = supabaseClient.channel(`room_${matchObj.id}`, { config: { broadcast: { self: false } } });
  gameChannel
    .on('broadcast', { event: 'match_started' }, ({ payload }) => {
      currentMatch = payload.match;
      updatePlayerHeaders(currentMatch);
      loadOpenLobby();
      loadLiveMatches();
      if (!isSpectator) {
        document.getElementById('game-status').innerText = `⚔️ Opponent Connected (${currentMatch.black_name})! White to move.`;
        playSound('move');
      }
      startClock();
    })
    .on('broadcast', { event: 'move' }, ({ payload }) => {
      const m = game.move(payload.move);
      if (m) lastMoveSquares = [m.from, m.to];
      timeWhite = payload.timeWhite;
      timeBlack = payload.timeBlack;
      afterMove(m);
    })
    .on('broadcast', { event: 'reaction' }, ({ payload }) => {
      document.getElementById('game-status').innerText = `💬 ${payload.sender}: ${payload.msg}`;
    })
    .on('broadcast', { event: 'game_action' }, ({ payload }) => {
      if (payload.action === 'resign') {
        clearInterval(timerInterval);
        playSound('end');
        document.getElementById('game-status').innerText = `🏳 ${payload.user} resigned!`;
        document.getElementById('btn-rematch').style.display = isSpectator ? 'none' : 'inline-block';
      } else if (payload.action === 'draw_offer' && !isSpectator) {
        if (confirm(`${payload.user} offered a draw. Accept?`)) {
          gameChannel.send({ type: 'broadcast', event: 'game_action', payload: { action: 'draw_accepted' } });
          concludeMultiplayerMatch(null, 'Mutual Draw');
        }
      } else if (payload.action === 'draw_accepted') {
        concludeMultiplayerMatch(null, 'Mutual Draw');
      } else if (payload.action === 'takeback_offer' && !isSpectator) {
        if (confirm(`${payload.user} requested a takeback (undo last move). Allow?`)) {
          game.undo();
          lastMoveSquares = [];
          board.position(game.fen());
          updateBoardHighlights();
          renderMoveTable();
          updateLichessMaterial();
          updateStatus();
          gameChannel.send({ type: 'broadcast', event: 'game_action', payload: { action: 'takeback_accepted' } });
        }
      } else if (payload.action === 'takeback_accepted') {
        game.undo();
        lastMoveSquares = [];
        board.position(game.fen());
        updateBoardHighlights();
        renderMoveTable();
        updateLichessMaterial();
        updateStatus();
        document.getElementById('game-status').innerText = '⏪ Takeback accepted!';
      } else if (payload.action === 'rematch_ready' && !isSpectator) {
        if (confirm(`Opponent wants a Rematch! Join now?`)) {
          joinWaitingMatch(payload.newMatchId, currentIncrement);
        }
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED' && onSubscribedCallback) {
        onSubscribedCallback();
      }
    });
}

function updatePlayerHeaders(m) {
  const wLabel = `${m.white_name || 'Guest'} (${m.white_rating || 1500})`;
  const bLabel = `${m.black_name || 'Waiting...'} (${m.black_rating || '?'})`;
  if (myColor === 'b') {
    document.getElementById('bottom-name').innerText = bLabel;
    document.getElementById('top-name').innerText = wLabel;
  } else {
    document.getElementById('bottom-name').innerText = wLabel;
    document.getElementById('top-name').innerText = bLabel;
  }
}

async function concludeMultiplayerMatch(winnerId, reason) {
  clearInterval(timerInterval);
  isMultiplayer = false;
  document.getElementById('btn-resign').disabled = true;
  document.getElementById('btn-draw').disabled = true;
  if (!isSpectator) {
    document.getElementById('btn-rematch').style.display = 'inline-block';
  }
  document.getElementById('game-status').innerText = `🏁 Game Over • ${reason}`;

  if (!supabaseClient || !currentMatch || isSpectator) return;
  await supabaseClient.from('chess_matches').update({
    status: 'finished',
    winner_id: winnerId,
    result_reason: reason,
    pgn: game.pgn(),
    fen: game.fen()
  }).eq('id', currentMatch.id);

  if (winnerId && currentUser && currentUser.id === winnerId) {
    const newRating = currentProfile.rating + 12;
    await supabaseClient.from('chess_profiles').update({ rating: newRating, wins: (currentProfile.wins || 0) + 1 }).eq('id', currentUser.id);
    currentProfile.rating = newRating;
    document.getElementById('user-rating').innerText = newRating;
  } else if (winnerId && currentUser && currentUser.id !== winnerId) {
    const newRating = Math.max(800, currentProfile.rating - 12);
    await supabaseClient.from('chess_profiles').update({ rating: newRating, losses: (currentProfile.losses || 0) + 1 }).eq('id', currentUser.id);
    currentProfile.rating = newRating;
    document.getElementById('user-rating').innerText = newRating;
  }
  loadLiveMatches();
  loadLeaderboard();
}

// ==========================================
// 7. LOBBY & LIVE MATCHES UI RENDERING
// ==========================================
function copyMatchId(text) {
  navigator.clipboard.writeText(text);
  document.getElementById('game-status').innerText = `📋 Copied to clipboard: ${text.substring(0, 18)}...`;
}

async function loadOpenLobby() {
  if (!supabaseClient) return;
  const { data } = await supabaseClient
    .from('chess_matches')
    .select('*')
    .eq('status', 'waiting')
    .order('created_at', { ascending: false })
    .limit(8);

  const ul = document.getElementById('open-lobby-list');
  if (!ul) return;

  if (!data || data.length === 0) {
    ul.innerHTML = '<li class="list-item">No waiting challenges. Click a time control to start!</li>';
    return;
  }

  ul.innerHTML = data.map(m => {
    const isMine = isMatchCreatedByMe(m);
    const meta = parseMatchMeta(m.result_reason);
    const tcStr = `${m.time_control / 60}+${meta.inc}`;
    const name = m.white_name || 'Guest';
    const fullId = m.id;

    const actionBtn = isMine
      ? `<button class="danger" style="padding:4px 10px; font-size:0.78rem;" onclick="cancelLobby('${fullId}')">Cancel</button>`
      : `<button style="background:var(--accent); padding:4px 12px; font-size:0.78rem;" onclick="joinWaitingMatch('${fullId}', ${meta.inc})">Play</button>`;

    return `
      <li class="list-item">
        <div class="list-item-row">
          <span><strong>${name}</strong> (${m.white_rating || 1500}) • <strong style="color:var(--accent)">${tcStr}</strong></span>
          ${actionBtn}
        </div>
        <div class="list-item-row" style="font-size: 0.73rem; color: #888;">
          <span>ID (Click copy):</span>
          <input type="text" class="copy-id-input" value="${fullId}" readonly title="Click to copy Match ID" onclick="copyMatchId('${fullId}')">
          ${isMine ? '<span style="color:var(--accent); font-weight:600;">Yours</span>' : ''}
        </div>
      </li>
    `;
  }).join('');
}

async function loadLiveMatches() {
  if (!supabaseClient) return;
  const { data } = await supabaseClient
    .from('chess_matches')
    .select('*')
    .eq('status', 'playing')
    .order('created_at', { ascending: false })
    .limit(8);

  const ul = document.getElementById('live-matches-list');
  if (!ul) return;

  if (!data || data.length === 0) {
    ul.innerHTML = '<li class="list-item">No live matches running right now.</li>';
    return;
  }

  ul.innerHTML = data.map(m => {
    const fullId = m.id;
    return `
      <li class="list-item">
        <div class="list-item-row">
          <span>⚔️ <strong>${m.white_name || 'Guest'}</strong> vs <strong>${m.black_name || 'Guest'}</strong></span>
          <button class="secondary" style="padding:4px 10px; font-size:0.78rem;" onclick="spectateMatch('${fullId}')">Watch</button>
        </div>
        <div class="list-item-row" style="font-size: 0.73rem; color: #888;">
          <span>ID (Click copy):</span>
          <input type="text" class="copy-id-input" value="${fullId}" readonly title="Click to copy Match ID" onclick="copyMatchId('${fullId}')">
        </div>
      </li>
    `;
  }).join('');
}

async function loadLeaderboard() {
  if (!supabaseClient) return;
  const { data } = await supabaseClient
    .from('chess_profiles')
    .select('username, rating, wins')
    .order('rating', { ascending: false })
    .limit(10);

  const ul = document.getElementById('leaderboard-list');
  if (!ul || !data || data.length === 0) return;

  ul.innerHTML = data.map((p, idx) => `
    <li class="list-item">
      <div class="list-item-row">
        <span>#${idx + 1} <strong>${p.username}</strong></span>
        <span class="badge-rating">${p.rating}</span>
      </div>
    </li>
  `).join('');
}

function subscribeLobbyChanges() {
  if (!supabaseClient) return;
  supabaseClient
    .channel('public:chess_matches')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chess_matches' }, () => {
      loadOpenLobby();
      loadLiveMatches();
    })
    .subscribe();
}

// ==========================================
// 8. INTERNATIONAL ACTIONS (TAKEBACK, REMATCH, PGN, FEN)
// ==========================================
function requestTakeback() {
  if (isSpectator || game.history().length === 0) return;
  if (!isMultiplayer) {
    game.undo();
    if (vsAiBot && game.turn() === 'b') game.undo();
    lastMoveSquares = [];
    board.position(game.fen());
    updateBoardHighlights();
    renderMoveTable();
    updateLichessMaterial();
    updateStatus();
    return;
  }
  if (gameChannel) {
    const sender = currentUser ? currentProfile.username : guestDisplayName;
    gameChannel.send({ type: 'broadcast', event: 'game_action', payload: { action: 'takeback_offer', user: sender } });
    document.getElementById('game-status').innerText = '⏪ Takeback request sent to opponent...';
  }
}

async function offerRematch() {
  if (!supabaseClient || !currentMatch) return;
  const tc = currentMatch.time_control || 600;
  const hostName = currentUser ? currentProfile.username : guestDisplayName;
  const hostId = currentUser ? currentUser.id : null;
  const hostRating = currentUser ? currentProfile.rating : 1500;

  const { data: created } = await supabaseClient.from('chess_matches').insert([{
    white_id: hostId,
    white_name: hostName,
    white_rating: hostRating,
    time_control: tc,
    status: 'waiting',
    result_reason: encodeMatchMeta(currentIncrement)
  }]).select().single();

  if (created) {
    if (gameChannel) {
      gameChannel.send({ type: 'broadcast', event: 'game_action', payload: { action: 'rematch_ready', newMatchId: created.id } });
    }
    setupMatchRoom(created, 'w');
    document.getElementById('game-status').innerText = '⚔️ Rematch offer sent! Waiting for opponent...';
  }
}

function sendQuickReaction(msg) {
  const sender = currentUser ? currentProfile.username : guestDisplayName;
  document.getElementById('game-status').innerText = `💬 You: ${msg}`;
  if (isMultiplayer && gameChannel) {
    gameChannel.send({ type: 'broadcast', event: 'reaction', payload: { sender, msg } });
  }
}

function copyPGN() {
  const pgn = game.pgn() || 'No moves played yet.';
  navigator.clipboard.writeText(pgn);
  document.getElementById('game-status').innerText = '📋 PGN move history copied to clipboard!';
}

function copyFEN() {
  const fen = game.fen();
  navigator.clipboard.writeText(fen);
  document.getElementById('game-status').innerText = '📋 Board FEN copied to clipboard!';
}

function resignGame() {
  if (!isMultiplayer || !currentMatch || isSpectator) return;
  if (!confirm('Are you sure you want to resign this match?')) return;
  const sender = currentUser ? currentProfile.username : guestDisplayName;
  gameChannel.send({ type: 'broadcast', event: 'game_action', payload: { action: 'resign', user: sender } });
  const winnerId = myColor === 'w' ? currentMatch.black_id : currentMatch.white_id;
  concludeMultiplayerMatch(winnerId, 'Resignation');
}

function offerDraw() {
  if (!isMultiplayer || !gameChannel || isSpectator) return;
  const sender = currentUser ? currentProfile.username : guestDisplayName;
  gameChannel.send({ type: 'broadcast', event: 'game_action', payload: { action: 'draw_offer', user: sender } });
  document.getElementById('game-status').innerText = '½ Draw offer sent to opponent.';
}

function playVsComputer(enableAiBot = false) {
  isMultiplayer = false;
  isSpectator = false;
  vsAiBot = enableAiBot;
  game.reset();
  clearSelection();
  lastMoveSquares = [];
  timeWhite = 600;
  timeBlack = 600;
  board.orientation('white');
  board.start();
  updateBoardHighlights();
  updateLichessMaterial();
  renderMoveTable();
  renderClocks();
  document.getElementById('btn-resign').disabled = true;
  document.getElementById('btn-draw').disabled = true;
  document.getElementById('btn-takeback').disabled = false;
  document.getElementById('btn-rematch').style.display = 'none';
  document.getElementById('bottom-name').innerText = currentUser ? currentProfile.username : guestDisplayName;
  document.getElementById('top-name').innerText = enableAiBot ? '🤖 Wedugo AI Bot (1600)' : 'Local Player 2';
  document.getElementById('active-match-badge').innerText = enableAiBot ? 'vs AI Bot' : 'Pass & Play';
  document.getElementById('game-status').innerText = enableAiBot
    ? '🤖 Playing vs AI Bot! Click any White piece to move.'
    : '♟ Solo / Pass & Play mode active. Click any White piece to move.';
}

function flipBoard() {
  board.flip();
  updateBoardHighlights();
  updateLichessMaterial();
  renderClocks();
}

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

// ==========================================
// 9. INITIALIZE BOARD
// ==========================================
board = Chessboard('myBoard', {
  draggable: false, // Default is Click-to-Move (controlled by #chk-click-move checkbox)
  position: 'start',
  pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: () => board.position(game.fen())
});

updateLichessMaterial();
renderClocks();
initSupabaseSession();
window.addEventListener('resize', () => {
  board.resize();
  updateBoardHighlights();
});
