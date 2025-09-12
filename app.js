/* Prettier width 80  –  Zashi-demo wallet  (MOCK) */
console.log('NEW FILE LOADED3');

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const routes = {
  dashboard: renderDashboard,
  send: renderSend,
  receive: renderReceive,
  transactions: renderTransactions,
  settings: renderSettings,
  more: renderMore,
  swap: renderSwap,
  crosspay: renderCrossPay,
  addressBook: renderAddressBook,
  advanced: renderAdvanced,
  feedback: renderFeedback,
  about: renderAbout,
  whatsNew: renderWhatsNew,
  pay: () => nav('crosspay'),
  dex: renderDex,
  'asset-BTCs': () => renderAssetDetail('BTCs'),
  'asset-USDCs': () => renderAssetDetail('USDCs'),
  'asset-ETHs': () => renderAssetDetail('ETHs'),
  'asset-SOLs': () => renderAssetDetail('SOLs'),
  'asset-ZEPE': () => renderAssetDetail('ZEPE'),
};

function renderAssetDetail(assetCode) {
  const v = renderTemplate('tpl-asset-detail');
  setView(v);
  attachCommon();
  
  const assetIcons = {
    BTCs: '₿', USDCs: '💵', ETHs: '🔷', SOLs: '☀️', ZEPE: '🐸'
  };
  
  const nameMap = {
    BTCs: 'Bitcoin (shielded)',
    USDCs: 'USDC (shielded)', 
    ETHs: 'Ethereum (shielded)',
    SOLs: 'Solana (shielded)',
    ZEPE: 'Zepe Memecoin'
  };
  const balance = state.assets[assetCode] || 0;
  const usdValue = toUsd(assetCode, balance);
  
  $('#assetTitle').textContent = assetCode;
  $('#assetIcon').textContent = assetIcons[assetCode] || '💎';
  $('#assetName').textContent = nameMap[assetCode] || assetCode;
  $('#assetBalance').textContent = balance.toFixed(6);
  $('#assetUsd').textContent = formatFiat(usdValue);
  
  // Filter transactions for this asset
  const assetTxs = state.txs.filter(tx => tx.asset === assetCode);
  const list = $('#assetTxList');
  list.innerHTML = '';
  
  if (assetTxs.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:var(--muted);padding:40px;">No transactions yet</div>';
  } else {
    assetTxs.forEach(tx => list.appendChild(renderTxItem(tx)));
  }
}

let state = loadState();
if (state.assets && 'ZEC' in state.assets) {
  delete state.assets.ZEC;
  saveState();
}
let historyStack = ['dashboard'];
let privacy = false;

/* ----------  helpers / state / prices  ---------- */
const PRICES = {
  ZEC: () => state.usdRate,
  BTCs: () => 116000,
  USDCs: () => 1,
  ETHs: () => 4600,
  SOLs: () => 240,
  ZEPE: () => 0.08,
  // Near swap assets
  SOL: () => 240,
  ETH: () => 4600,
  NEAR: () => 2.7,
  SUI: () => 1.5,
  ARB: () => 0.85,
  DOGE: () => 0.26,
  XRP: () => 3,
  USDC: () => 1,
};

function toUsd(asset, amount) {
  const p = PRICES[asset] ? PRICES[asset]() : 1;
  return p * amount;
}
function quote(fromAsset, toAsset, fromAmt) {
  const usd = toUsd(fromAsset, fromAmt);
  const toPrice = PRICES[toAsset] ? PRICES[toAsset]() : 1;
  return usd / toPrice;
}

function loadState() {
  const s = JSON.parse(localStorage.getItem('zashi-demo') || '{}');
  return {
    zecBalance: Number.isFinite(+s.zecBalance) ? +s.zecBalance : 0.05146343,
    usdRate: s.usdRate ?? 49.15,
    txs: s.txs ?? seedTxs(),
    addressBook:
      s.addressBook ??
      [
        { name: 'shielded-zcash', address: 'u1230dg0sdhgsh...ga54s' },
        { name: 'test-zcash', address: 't1ghsdh...xyz' },
        { name: 'base-address', address: '0xgdghadg546ag...1gasd' },
      ],
    taddr: s.taddr ?? 't1hgasdpghjiaiop6Abcdefghij123',
    zaddr: s.zaddr ?? randomShielded(),
    pendingTimer: s.pendingTimer ?? null,
    assets: s.assets ?? { BTCs: 0.1, USDCs: 0.1, ETHs: 0.1, SOLs: 0.1, ZEPE: 0.1 },
    portfolioExpanded: s.portfolioExpanded ?? false,
  };
}
function saveState() {
  localStorage.setItem('zashi-demo', JSON.stringify(state));
}

function seedTxs() {
  const ago = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();
  return [
    tx('recv', +2.8, '3 days ago', ago(3), true),
    tx('sent', -0.17, '5 days ago', ago(5)),
    tx('recv', +0.69, '6 days ago', ago(6)),
    tx('sent', -0.1337, '6 days ago', ago(6)),
    tx('sent', -0.04, '6 days ago', ago(6)),
    tx('sent', -1, '6 days ago', ago(6)),
    tx('recv', +3, '7 days ago', ago(7)),
  ];
}
function tx(kind, amount, rel, iso, shielded = false) {
  return {
    id: Math.random().toString(36).slice(2),
    kind,
    amount,
    rel,
    time: iso,
    shielded,
    status: 'confirmed',
  };
}

function formatZec(n) {
  const abs = Math.abs(n);
  const s = abs.toLocaleString('en-US', {
    minimumFractionDigits: abs < 1 ? 8 : 4,
    maximumFractionDigits: 8,
  });
  const sign = n > 0 ? '' : '- ';
  return `${sign}${s} ZEC`;
}
function formatFiat(n) {
  return `$${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
function showToast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

/* ----------  router  ---------- */
function nav(name) {
  if (!routes[name]) return;
  historyStack.push(name);
  routes[name]();
}
function historyBack() {
  historyStack = ['dashboard'];
  renderDashboard();
}
function setView(el) {
  const container = $('#viewContainer');
  container.innerHTML = '';
  container.appendChild(el);
  // Do not bind any buttons here; attachCommon will handle all data-navs
}
function renderTemplate(id) {
  return document.importNode($(`#${id}`).content, true);
}
function setPrivText(selector, text) {
  $$(selector).forEach((el) => {
    el.textContent = privacy ? '•••••' : text;
  });
}

function setPrivacyMode(isPrivate) {
  privacy = isPrivate;
  
  // Hide/show main balance
  setPrivText('[data-priv="zec-balance"]', `ᙇ${state.zecBalance.toFixed(3)}`);
  setPrivText('[data-priv="usd-balance"]', formatFiat(state.zecBalance * state.usdRate));
  setPrivText('[data-priv="zec-balance-large"]', `ᙇ${state.zecBalance.toFixed(6)}`);
  
  // Hide/show portfolio total
  const portfolioTotalEl = $('.portfolio-total-value');
  if (portfolioTotalEl) {
    const totalPortfolioUsd = Object.entries(state.assets)
      .filter(([a]) => a !== 'ZEC')
      .reduce((sum, [a, amt]) => sum + toUsd(a, +amt || 0), 0);
    portfolioTotalEl.textContent = privacy ? 'Total: •••••' : `Total: ${formatFiat(totalPortfolioUsd)}`;
  }
  
  // Hide/show individual asset amounts
  Object.keys(state.assets).forEach(asset => {
    setPrivText(`[data-priv="asset-${asset}"]`, (state.assets[asset] || 0).toFixed(6));
  });
  
  // Hide/show transaction amounts
  $$('.tx-item .amount-pos, .tx-item .amount-neg').forEach(el => {
    const originalAmount = el.dataset.originalAmount;
    if (originalAmount) {
      el.textContent = privacy ? '••••• ' + originalAmount.split(' ')[1] : originalAmount;
    }
  });
}

/* ----------  screens  ---------- */
function renderDashboard() {
  const v = renderTemplate('tpl-dashboard');

  // 1) Compute portfolio total (same logic you already have)
  const entries = Object.entries(state.assets)
    .filter(([a]) => a !== 'ZEC')
    .map(([a, amt]) => ({ a, amt: +amt || 0, usd: toUsd(a, +amt || 0) }))
    .sort((x, y) => y.usd - x.usd);
  const totalPortfolioUsd = entries.reduce((sum, { usd }) => sum + usd, 0);

  // 2) Inject the total into the list header section
  const header = v.querySelector('section.list-header');
  if (header) {
    // Ensure header uses flex and space-between (or center as you prefer)
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.gap = '8px';

    // Clear any previous injected total
    const old = header.querySelector('.portfolio-total-inline');
    if (old) old.remove();

    // Create the inline total element
    const totalEl = document.createElement('div');
    totalEl.className = 'portfolio-total-inline';
    totalEl.textContent = privacy
      ? 'Total: •••••'
      : `Total: ${formatFiat(totalPortfolioUsd)}`;

    // Optional: style it subtle and center-flex it
    totalEl.style.marginLeft = '18px';
    totalEl.style.marginRight = 'auto';
    totalEl.style.color = 'var(--muted)';
    totalEl.style.fontSize = '16px';

    // Insert between <h2> and the button
    const h2 = header.querySelector('h2');
    const tradeBtn = header.querySelector('.trade-btn');
    if (h2 && tradeBtn) {
      header.insertBefore(totalEl, tradeBtn);
    } else {
      // Fallback: append if structure differs
      header.appendChild(totalEl);
    }
  }

  // ... rest of your existing renderDashboard below ...

  const grid = v.querySelector('#assetGrid');
  if (grid) {
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = '1fr';
    grid.innerHTML = '';

    const assetIcons = {
      BTCs: '₿',
      USDCs: '💵',
      ETHs: '🔷',
      SOLs: '☀️',
      ZEPE: '🐸',
      SOL: '☀️',
      ETH: '🔷',
      NEAR: '🌊',
      SUI: '🌀',
      ARB: '🔵',
      DOGE: '🐕',
      XRP: '💧',
    };

    const nameMap = {
      BTCs: 'Bitcoin (shielded)',
      USDCs: 'USDC (shielded)',
      ETHs: 'Ethereum (shielded)',
      SOLs: 'Solana (shielded)',
      ZEPE: 'Zepe Memecoin',
    };

    const visible = state.portfolioExpanded ? entries : entries.slice(0, 3);

    // If you still want the total inside the grid as well, keep your existing code.
    // Otherwise, you can remove the previous "portfolio-total" header you were injecting
    // into the grid to avoid duplication.

    visible.forEach(({ a, amt, usd }) => {
      const row = document.createElement('div');
      row.className = 'asset-card asset-row clickable';
      row.style.margin = '6px 0';
      row.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="asset-icon">${assetIcons[a] || '💎'}</span>
            <div>
              <div class="asset-name">${nameMap[a] || a}</div>
              <div class="tx-sub">${privacy ? '•••••' : formatFiat(usd)}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div class="asset-amt" data-priv="asset-${a}">${
              privacy ? '•••••' : amt.toFixed(6)
            }</div>
            <div class="asset-arrow">›</div>
          </div>
        </div>`;
      row.onclick = () => nav(`asset-${a}`);
      grid.appendChild(row);
    });

    if (entries.length > 3) {
      const toggleWrap = document.createElement('div');
      toggleWrap.style.padding = '0 0 8px 0';
      toggleWrap.innerHTML = `<button class="secondary" id="pfToggle">${
        state.portfolioExpanded ? '↑' : '↓'
      }</button>`;
      grid.appendChild(toggleWrap);
      $('#pfToggle', grid).onclick = () => {
        state.portfolioExpanded = !state.portfolioExpanded;
        saveState();
        renderDashboard();
      };
    }
  }

  const list = v.querySelector('#txList');
  list.append(...state.txs.slice(0, 4).map(renderTxItem));

  setView(v);
  attachCommon();

  const z = Number.isFinite(+state.zecBalance) ? +state.zecBalance : 0;
  setPrivText('[data-priv="zec-balance"]', `ᙇ${z.toFixed(3)}`);
  setPrivText('[data-priv="usd-balance"]', formatFiat(z * state.usdRate));

  $('#refreshRates').onclick = () => {
    state.usdRate = +(
      state.usdRate * (0.98 + Math.random() * 0.04)
    ).toFixed(2);
    saveState();
    showToast('Rates updated');
    renderDashboard();
  };
  $$('.action-tile').forEach((b) => {
    const to = b.getAttribute('data-nav');
    b.onclick = () => nav(to);
  });
  $$('.see-all').forEach((btn) => {
    btn.onclick = (e) => nav(e.currentTarget.dataset.nav || 'transactions');
  });
  $$('.trade-btn').forEach((btn) => {
    btn.onclick = (e) => nav(e.currentTarget.dataset.nav || 'dex');
  });
}

function formatAmount(n, asset) {
  const abs = Math.abs(n);
  const dec = asset === 'ZEC' ? (abs < 1 ? 8 : 4) : 6;
  return `${abs.toLocaleString('en-US', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  })} ${asset}`;
}

function renderTxItem(t) {
  const el = document.createElement('div');
  el.className = 'tx-item';
  const isSwap = t.asset && t.asset !== 'ZEC';
  const label = t.kind === 'recv' ? 'Received' : isSwap ? 'Swap' : 'Sent';
  const symbol = t.asset || 'ZEC';
  const sign = t.amount >= 0 ? '+' : '-';
  const icon = t.kind === 'recv' ? '↓' : '↑';
  const amountText = `${sign} ${formatAmount(Math.abs(t.amount), symbol)}`;

  el.innerHTML = `
    <div class="tx-icon">${icon}</div>
    <div class="tx-main">
      <div class="tx-title">${label}${t.shielded ? ' 🛡' : ''}${
    t.status === 'pending' ? '• Sending…' : ''
  }</div>
      <div class="tx-sub">${new Date(t.time).toLocaleString()}</div>
    </div>
    <div class="${t.amount >= 0 ? 'amount-pos' : 'amount-neg'}" data-original-amount="${amountText}">
      ${privacy ? '••••• ' + symbol : amountText}
    </div>`;
  el.onclick = () => navToTxDetails(t);
  return el;
}

function navToTxDetails(t) {
  const txid = (t.id + Math.random().toString(16).slice(2)).slice(0, 16);
  const toAddr =
    t.kind === 'recv'
      ? state.zaddr
      : 'u1ce63a2h6227rgc4f6p...' + Math.random().toString(36).slice(2, 6);
  const fee = 0.0001;
  const memo = t.kind === 'sent' ? 'tx1' : 'tx2';
  const usdVal = toUsd(t.asset || 'ZEC', Math.abs(t.amount));
  state.__lastDetails = { t, txid, toAddr, fee, memo, usdVal };
  renderTxDetails();
  historyStack.push('txdetails');
}

function feeToStr(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

function renderTransactions() {
  const v = renderTemplate('tpl-transactions');
  const list = v.querySelector('#txListFull');
  state.txs.forEach((t) => list.appendChild(renderTxItem(t)));
  setView(v);
  attachCommon();
  $('#txSearch').oninput = (e) => {
    const q = e.target.value.toLowerCase();
    list.innerHTML = '';
    state.txs
      .filter(
        (t) =>
          t.kind.includes(q) ||
          formatAmount(t.amount, t.asset || 'ZEC').toLowerCase().includes(q) ||
          new Date(t.time).toLocaleString().toLowerCase().includes(q)
      )
      .forEach((t) => list.appendChild(renderTxItem(t)));
  };
}

function renderSend() {
  const v = renderTemplate('tpl-send');
  setView(v);
  attachCommon();
  setPrivText('[data-priv="zec-balance-large"]', `ᙇ${state.zecBalance.toFixed(6)}`);
  const zecInput = $('#amountZec');
  const usdInput = $('#amountUsd');
  zecInput.oninput = () => {
    const z = +zecInput.value || 0;
    usdInput.value = (z * state.usdRate).toFixed(2);
  };
  usdInput.oninput = () => {
    const u = +usdInput.value || 0;
    zecInput.value = (u / state.usdRate).toFixed(8);
  };
  $('#reviewSend').onclick = () => {
    const addr = $('#sendAddress').value.trim();
    const z = +zecInput.value;
    if (!addr || z <= 0) return showToast('Enter address and amount');
    openConfirm(
      'CONFIRMATION',
      `<div style="text-align:center"><div style="font-size:44px;font-weight:800;letter-spacing:1px;margin:4px 0;">${formatZec(z).replace('-', '')}</div><div style="color:#a3a0a6;margin-bottom:10px;">${formatFiat(z * state.usdRate)}</div></div><div class="menu-list"><div class="menu-item"><div style="color:#a3a0a6;font-size:12px">Sending to</div><div class="card-mono">${addr}</div></div><div class="menu-item" style="display:flex;justify-content:space-between"><span>Fee</span><b>0,0001 ZEC</b></div></div>`,
      () => {
        showSendingScreen(addr);
        setTimeout(() => {
          state.txs.unshift({ id: Math.random().toString(36).slice(2), kind: 'sent', amount: -z, time: new Date().toISOString(), shielded: true, status: 'confirmed' });
          state.zecBalance = +(state.zecBalance - z).toFixed(8);
          saveState();
          renderDashboard();
          showToast('Sent (mock)');
        }, 3000);
      },
      'Send'
    );
  };
  $('#pickContact').onclick = () => nav('addressBook');
  $('#scanQr').onclick = () => showToast('QR scanner not available in demo');
}

function renderReceive() {
  const v = renderTemplate('tpl-receive');
  setView(v);
  attachCommon();
  $('#taddr').textContent = state.taddr;
  $('#copyShielded').onclick = () => {
    navigator.clipboard.writeText(state.zaddr);
    showToast('Shielded address copied');
    state.zaddr = randomShielded();
    saveState();
  };
  $('#qrShielded').onclick = () => {
    openConfirm(
      '', 
      `<div class="qr-modal">
        <h3>Shielded Address QR Code</h3>
        <div class="qr-container">
          <canvas id="qr"></canvas>
        </div>
        <div class="qr-address">${state.zaddr}</div>
      </div>`,
      null,
      'Close'
    );
    setTimeout(() => window.QRCode.toCanvas($('#qr'), state.zaddr, { 
      width: 200, 
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    }));
  };

  // Enhanced payment request handler
  $('#reqShielded').onclick = () => {
    openPaymentRequestModal();
  };

  $('#copyTransparent').onclick = () => {
    navigator.clipboard.writeText(state.taddr);
    showToast('Transparent address copied');
  };
}

function openPaymentRequestModal() {
  openConfirm(
    'Create Payment Request',
    `<div class="payment-request-form">
      <div class="field">
        <label>Asset Type</label>
        <select id="requestAsset" class="asset-select">
          <option value="ZEC">ZEC - Zcash</option>
          <option value="BTCs">Bitcoin (shielded)</option>
          <option value="USDCs">USDC (shielded)</option>
          <option value="ETHs">Ethereum (shielded)</option>
          <option value="SOLs">Solana (shielded)</option>
          <option value="ZEPE">Zepe Memecoin</option>
        </select>
      </div>
      <div class="field">
        <label>Amount (optional)</label>
        <input id="requestAmount" type="number" step="0.00000001" placeholder="Leave empty for any amount" />
      </div>
      <div class="field">
        <label>Message/Memo (optional)</label>
        <textarea id="requestMemo" maxlength="512" placeholder="Payment description or memo..."></textarea>
        <div class="hint">Max 512 characters</div>
      </div>
      <div class="field">
        <label>Request Label (optional)</label>
        <input id="requestLabel" type="text" placeholder="e.g., Invoice #123, Coffee payment..." />
      </div>
    </div>`,
    () => {
      const asset = $('#requestAsset').value;
      const amount = $('#requestAmount').value.trim();
      const memo = $('#requestMemo').value.trim();
      const label = $('#requestLabel').value.trim();
      
      generatePaymentRequest(asset, amount, memo, label);
    },
    'Generate Request'
  );
}

function generatePaymentRequest(asset, amount, memo, label) {
  // Use appropriate address based on asset type
  const address = asset === 'ZEC' ? state.zaddr : state.zaddr; // In real implementation, this would vary by asset
  
  // Build payment URI according to ZIP-321 standard
  let uri = `zcash:${address}`;
  let params = [];
  
  if (amount) {
    params.push(`amount=${amount}`);
  }
  
  if (memo) {
    // Base64 encode the memo for URI safety
    const encodedMemo = btoa(memo);
    params.push(`memo=${encodedMemo}`);
  }
  
  if (label) {
    params.push(`label=${encodeURIComponent(label)}`);
  }
  
  // Add asset type if not ZEC
  if (asset !== 'ZEC') {
    params.push(`asset=${asset}`);
  }
  
  if (params.length > 0) {
    uri += '?' + params.join('&');
  }
  
  // Create a shareable payment link (mock URL)
  const shareableLink = `https://pay.zashi.app/request?${btoa(uri)}`;
  
  showPaymentRequestResult(uri, shareableLink, asset, amount, memo, label);
}

function showPaymentRequestResult(uri, shareableLink, asset, amount, memo, label) {
  const assetIcons = {
    ZEC: 'ᙇ',
    BTCs: '₿',
    USDCs: '💵',
    ETHs: '🔷',
    SOLs: '☀️',
    ZEPE: '🐸'
  };
  
  const displayAmount = amount ? `${amount} ${asset}` : `Any amount of ${asset}`;
  const displayMemo = memo ? memo : '';
  const displayLabel = label ? label : 'Payment Request';
  
  // Shortened URLs for better mobile display
  const shortLink = shareableLink.length > 40 ? shareableLink.substring(0, 40) + '...' : shareableLink;
  const shortUri = uri.length > 50 ? uri.substring(0, 50) + '...' : uri;
  
  openConfirm(
    'Payment Request Created',
    `<div class="payment-request-result">
      <div class="request-header">
        <div class="request-icon">${assetIcons[asset] || '💎'}</div>
        <div class="request-title">${displayLabel}</div>
        <div class="request-amount">${displayAmount}</div>
        ${memo ? `<div class="request-memo">"${displayMemo}"</div>` : ''}
      </div>
      
      <div class="request-actions">
        <div class="action-section">
          <div class="section-header">
            <h4>QR Code</h4>
            <button class="icon-btn" id="saveQr" title="Save QR">💾</button>
          </div>
          <div class="qr-container">
            <canvas id="requestQr"></canvas>
          </div>
        </div>
        
        <div class="action-section">
          <div class="section-header">
            <h4>Share Link</h4>
            <div class="header-icons">
              <button class="icon-btn" id="copyLink" title="Copy Link">📋</button>
              <button class="icon-btn" id="shareNative" title="Share">📤</button>
            </div>
          </div>
          <div class="share-link" id="shareLink">${shortLink}</div>
        </div>
        
        <div class="action-section">
          <div class="section-header">
            <h4>Payment URI</h4>
            <button class="icon-btn" id="copyUri" title="Copy URI">📋</button>
          </div>
          <div class="payment-uri" id="paymentUri">${shortUri}</div>
        </div>
      </div>
    </div>`,
    null,
    'Done'
  );
  
  // Generate smaller QR code
  setTimeout(() => {
    window.QRCode.toCanvas($('#requestQr'), uri, { 
      width: 240, // Reduced from 180
      margin: 1,  // Reduced margin
      color: { dark: '#000000', light: '#ffffff' }
    });
  });
  
  // Keep the same click handlers but with full URLs
  $('#copyLink').onclick = () => {
    navigator.clipboard.writeText(shareableLink);
    showToast('Payment link copied!');
  };
  
  $('#copyUri').onclick = () => {
    navigator.clipboard.writeText(uri);
    showToast('Payment URI copied!');
  };
  
  $('#shareNative').onclick = () => {
    if (navigator.share) {
      navigator.share({
        title: displayLabel,
        text: `Payment request for ${displayAmount}`,
        url: shareableLink
      });
    } else {
      navigator.clipboard.writeText(`${displayLabel}\n\nPayment request for ${displayAmount}\n${memo ? `Message: ${memo}\n` : ''}\n${shareableLink}`);
      showToast('Payment request copied to clipboard!');
    }
  };
  
  $('#saveQr').onclick = () => {
    const canvas = $('#requestQr');
    const link = document.createElement('a');
    link.download = `payment-request-${asset}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    showToast('QR code saved!');
  };
}

function renderSettings() {
  const v = renderTemplate('tpl-settings');
  setView(v);
  attachCommon();
}

function renderMore() {
  const v = renderTemplate('tpl-more');
  setView(v);
  attachCommon();

  const root = $('#viewContainer');
  const backdrop = $('#sheetBackdrop', root);
  if (backdrop) {
    backdrop.onclick = () => historyBack();
  }
}

function renderSwap() {
  const v = renderTemplate('tpl-swap');
  setView(v);
  attachCommon();
  $('#spendable').textContent = state.zecBalance.toFixed(8);
  
  const from = $('#swapFrom');
  const fUsd = $('#swapFromUsd');
  const toAmt = $('#swapToAmount');
  const toUsd = $('#swapToUsd');
  const assetSelect = $('#chooseAsset');
  const rateSpan = $('#rate');
  const rateAsset = $('#rateAsset');
  
  function recalc() {
    const z = +from.value || 0;
    const selectedAsset = assetSelect.value;
    const assetPrice = PRICES[selectedAsset]();
    
    fUsd.textContent = formatFiat(z * state.usdRate);
    const outAmount = (z * state.usdRate) / assetPrice;
    toAmt.textContent = outAmount.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 });
    toUsd.textContent = formatFiat(z * state.usdRate);
    
    // Update rate display
    rateSpan.textContent = (state.usdRate / assetPrice).toFixed(6);
    rateAsset.textContent = selectedAsset;
  }
  
  from.oninput = recalc;
  assetSelect.onchange = recalc;
  
  // Swap direction handler
  $('#swapDirection').onclick = () => {
    showToast('ZEC is always the "from" asset in Near swaps');
  };
  
  $('#getQuote').onclick = () => {
    const z = +from.value || 0;
    const selectedAsset = assetSelect.value;
    if (!z) return showToast('Enter amount');
    
    const addr = '0x458gaswe486gasdg46aa262g13d1fg';
    const outAmount = (z * state.usdRate) / PRICES[selectedAsset]();
    
    openConfirm(
      'Swap now',
      `<div class="menu-list"><div class="menu-item" style="display:flex;justify-content:space-between"><div><b>${z.toFixed(3)} ZEC</b><div class="tx-sub">${formatFiat(z * state.usdRate)}</div></div><div style="font-size:22px;">→</div><div><b>${outAmount.toFixed(6)} ${selectedAsset}</b><div class="tx-sub">${formatFiat(z * state.usdRate)}</div></div></div><div class="menu-item"><div class="tx-sub">Swap to</div><div class="card-mono">${addr}</div></div><div class="menu-item" style="display:flex;justify-content:space-between"><span>Total fees</span><b>0,00074438 ZEC</b></div><div class="menu-item" style="display:flex;justify-content:space-between"><span>Total Amount</span><b>${z.toFixed(3)} ZEC</b></div></div>`,
      () => {
        showSendingScreen(addr);
        
        // Update balances immediately
        state.zecBalance = +(state.zecBalance - z).toFixed(8);
        

        state.txs.unshift({ 
          id: Math.random().toString(36).slice(2), 
          kind: 'sent', 
          amount: -z, 
          asset: 'ZEC', 
          time: new Date().toISOString(), 
          shielded: true, 
          status: 'confirmed' 
        });
        
        saveState();
        renderDashboard();
        
        setTimeout(() => {
          showToast(`Swapped ${z.toFixed(6)} ᙇ → ${outAmount.toFixed(6)} ${selectedAsset} (sent to external address)`);
          renderDashboard();
        }, 3000);
      },
      'Confirm'
    );
  };
  
  recalc();
}

function renderCrossPay() {
  const v = renderTemplate('tpl-crosspay');
  setView(v);
  attachCommon();
  setPrivText('[data-priv="zec-balance-large"]', `ᙇ${state.zecBalance.toFixed(6)}`);
  
  const assetSelect = $('#xpayAsset');
  const amountInput = $('#xpayAmount');
  const zecInput = $('#xpayZec');
  
  function recalc() {
    const asset = assetSelect.value;
    const amount = +amountInput.value || 0;
    const assetPrice = PRICES[asset]();
    const usdValue = amount * assetPrice;
    const zecNeeded = usdValue / state.usdRate;
    zecInput.value = zecNeeded.toFixed(8);
  }
  
  assetSelect.onchange = recalc;
  amountInput.oninput = recalc;
  
  $('#xpayReview').onclick = () => {
    const amount = +amountInput.value;
    const zecAmount = +zecInput.value;
    const selectedAsset = assetSelect.value;
    const addr = $('#xpayAddress').value.trim();
    
    if (!amount || !zecAmount) return showToast('Enter amount');
    if (!addr) return showToast('Enter recipient address');
    
    openConfirm(
      'CrossPay Confirmation',
      `<div class="menu-list"><div class="menu-item" style="display:flex;justify-content:space-between"><div><b>${zecAmount.toFixed(6)} ZEC</b><div class="tx-sub">${formatFiat(zecAmount * state.usdRate)}</div></div><div style="font-size:22px;">→</div><div><b>${amount.toFixed(6)} ${selectedAsset}</b><div class="tx-sub">${formatFiat(amount * PRICES[selectedAsset]())}</div></div></div><div class="menu-item"><div class="tx-sub">CrossPay to</div><div class="card-mono">${addr}</div></div><div class="menu-item" style="display:flex;justify-content:space-between"><span>Total fees</span><b>0,00074438 ZEC</b></div></div>`,
      () => {
        showSendingScreen(addr);
        
        // Update ZEC balance
        state.zecBalance = +(state.zecBalance - zecAmount).toFixed(8);
        
        // Create transaction record
        state.txs.unshift({ 
          id: Math.random().toString(36).slice(2), 
          kind: 'sent', 
          amount: -zecAmount, 
          asset: 'ZEC', 
          time: new Date().toISOString(), 
          shielded: true, 
          status: 'confirmed' 
        });
        
        saveState();
        renderDashboard();
        
        setTimeout(() => {
          showToast(`CrossPay sent: ${zecAmount.toFixed(6)} ZEC → ${amount.toFixed(6)} ${selectedAsset}`);
          renderDashboard();
        }, 3000);
      },
      'Confirm CrossPay'
    );
  };
}

function renderAddressBook() {
  const v = renderTemplate('tpl-addressbook');
  function paint() {
    const ul = v.querySelector('#abList');
    ul.innerHTML = '';
    state.addressBook.forEach((c, i) => {
      const li = document.createElement('li');
      li.className = 'ab-item';
      li.innerHTML = `
        <div class="ab-avatar">${c.name.slice(0, 2).toUpperCase()}</div>
        <div><div style="font-weight:600">${c.name}</div><div class="card-mono">${c.address}</div></div>
        <button data-i="${i}" class="secondary">Use</button>`;
      ul.appendChild(li);
    });
    $$('.ab-item button', ul).forEach((b) => {
      b.onclick = () => {
        const i = +b.dataset.i;  const addr = state.addressBook[i].address;
        nav('send');
        setTimeout(() => {
          $('#sendAddress').value = addr;
          showToast('Address filled from contacts');
        }, 0);
      };
    });
  }
  paint();
  setView(v);
  attachCommon();
  $('#addContact').onclick = () => {
    openConfirm(
      'New Contact',
      `<div class="field"><label>Name</label><input id="cname"/></div><div class="field"><label>Address</label><input id="caddr"/></div>`,
      () => {
        const name = $('#cname').value.trim();  const addr = $('#caddr').value.trim();
        if (!name || !addr) return showToast('Enter name and address');
        state.addressBook.push({ name, address: addr });
        saveState();
        showToast('Contact added');
        renderAddressBook();
      }
    );
  };
}

function renderAdvanced() {
  const v = renderTemplate('tpl-advanced');
  setView(v);
  attachCommon();
  $('#resetDemo').onclick = () => {
    openConfirm(
      'Reset Demo',
      'This will clear local demo data. Continue?',
      () => {
        localStorage.removeItem('zashi-demo');
        state = loadState();
        if (state.assets && 'ZEC' in state.assets) {
          delete state.assets.ZEC;
          saveState();
        }
        showToast('Demo reset');
        nav('dashboard');
      }
    );
  };
}

function renderFeedback() {
  const v = renderTemplate('tpl-feedback');
  setView(v);
  attachCommon();
  let mood = '🙂';
  $('#moodRow').onclick = (e) => {
    if (e.target.tagName === 'BUTTON') {
      mood = e.target.textContent;
      showToast(`Mood: ${mood}`);
    }
  };
  $('#shareFeedback').onclick = () => {
    const txt = $('#feedbackText').value.trim();
    showToast('Thanks for the feedback!');
    console.log('Feedback (mock):', mood, txt);
    nav('dashboard');
  };
}

function renderAbout() {
  const v = renderTemplate('tpl-about');
  setView(v);
  attachCommon();
}

function renderWhatsNew() {
  const v = renderTemplate('tpl-whatsnew');
  setView(v);
  attachCommon();
}

function renderTxDetails() {
  const v = renderTemplate('tpl-txdetails');
  const d = state.__lastDetails;
  const isSwap = d.t.asset && d.t.asset !== 'ZEC';
  const header = isSwap ? 'Swap' : d.t.kind === 'recv' ? 'Received' : 'Sent';
  v.querySelector('#txType').textContent = header.toUpperCase();

  const sym = d.t.asset || 'ZEC';
  const usdV = toUsd(sym, Math.abs(d.t.amount));
  v.querySelector('#txAmount').innerHTML = `
    <span style="font-size:inherit">${formatAmount(d.t.amount, sym)}</span>
    <div style="color:var(--muted);font-size:14px;margin-top:4px">≈ ${formatFiat(usdV)}</div>
  `;

  v.querySelector('#txShield').style.opacity = d.t.shielded ? 1 : 0.2;
  v.querySelector('#txTo').textContent = d.toAddr;
  const shortId = d.txid.slice(0, 6) + '…' + d.txid.slice(-4);
  v.querySelector('#txId').textContent = shortId;
  v.querySelector('#txFee').textContent = `${feeToStr(d.fee)} ZEC`;
  v.querySelector('#txTime').textContent = new Date(d.t.time).toLocaleString();
  v.querySelector('#txMemo').textContent = d.memo;

  setView(v);
  attachCommon();

  v.querySelector('#copyTo').onclick = () => (navigator.clipboard.writeText(d.toAddr), showToast('Address copied'));
  v.querySelector('#copyId').onclick = () => (navigator.clipboard.writeText(d.txid), showToast('Tx ID copied'));
  v.querySelector('#addNote').onclick = () => showToast('Note added (mock)');
  v.querySelector('#saveAddr').onclick = () => showToast('Address saved (mock)');
}

function renderDex() {
  const v = renderTemplate('tpl-dex');
  setView(v);
  attachCommon();

  const fromSel = $('#dexFrom');
  const toSel = $('#dexTo');
  const fromAmt = $('#dexFromAmt');
  const toAmt = $('#dexToAmt');
  const rateLbl = $('#dexRate');

  function balOf(asset) {
    return asset === 'ZEC' ? state.zecBalance : state.assets[asset] ?? 0;
  }
  function setBal(elId, asset) {
    $(elId).textContent = (+balOf(asset)).toFixed(8);
  }
  function updateBalances() {
    setBal('#dexFromBal', fromSel.value);
    setBal('#dexToBal', toSel.value);
  }
  function refreshQuote() {
    const fa = fromSel.value;
    const ta = toSel.value;
    if (fa === ta) {
      rateLbl.textContent = 'Rate: — (choose different assets)';
      toAmt.value = '';
      return;
    }
    const f = +fromAmt.value || 0;
    const out = quote(fa, ta, f);
    toAmt.value = out ? out.toFixed(8) : '';
    const r = PRICES[fa]() && PRICES[ta]() ? (PRICES[ta]() / PRICES[fa]()).toFixed(6) : '—';
    rateLbl.textContent = `Rate: 1 ${fa} ≈ ${r} ${ta}`;
  }

  [fromSel, toSel].forEach((el) => (el.onchange = () => { updateBalances(); refreshQuote(); }));
  fromAmt.oninput = refreshQuote;
  toAmt.oninput = () => {
    const fa = fromSel.value;
    const ta = toSel.value;
    const t = +toAmt.value || 0;
    const f = PRICES[fa]() ? (t * PRICES[ta]()) / PRICES[fa]() : 0;
    fromAmt.value = f ? f.toFixed(8) : '';
  };

  // Add DEX swap direction handler
  $('#dexSwapDirection').onclick = () => {
    const currentFrom = fromSel.value;
    const currentTo = toSel.value;
    
    // Swap the selections
    fromSel.value = currentTo;
    toSel.value = currentFrom;
    
    // Clear amounts
    fromAmt.value = '';
    toAmt.value = '';
    
    // Update balances and refresh quote
    updateBalances();
    refreshQuote();
    
    showToast(`Swapped: ${currentFrom} ↔ ${currentTo}`);
  };

  $('#dexSwap').onclick = () => {
    const fa = fromSel.value;
    const ta = toSel.value;
    const f = +fromAmt.value || 0;
    if (!f || fa === ta) return showToast('Enter amount and distinct assets');

    const out = quote(fa, ta, f);

    openConfirm(
      'Confirm Swap',
      `<div class="menu-list"><div class="menu-item" style="display:flex;justify-content:space-between"><div><div class="tx-sub">From</div><b>${f.toFixed(8)} ${fa}</b></div><div style="font-size:22px;">→</div><div><div class="tx-sub">To</div><b>${out.toFixed(8)} ${ta}</b></div></div><div class="menu-item" style="display:flex;justify-content:space-between"><span>Est. Rate</span><b>1 ${fa} ≈ ${(PRICES[ta]() / PRICES[fa]()).toFixed(6)} ${ta}</b></div><div class="menu-item" style="display:flex;justify-content:space-between"><span>Fee</span><b>~ US$0.03 (mock)</b></div></div>`,
      () => {
        showSendingScreen(`${fa} → ${ta}`);

        // Update balances immediately
        if (fa === 'ZEC') {
          state.zecBalance = +(state.zecBalance - f).toFixed(8);
        } else {
          state.assets[fa] = +((state.assets[fa] || 0) - f).toFixed(8);
        }
        
        if (ta === 'ZEC') {
          state.zecBalance = +(state.zecBalance + out).toFixed(8);
        } else {
          state.assets[ta] = +((state.assets[ta] || 0) + out).toFixed(8);
        }

        // 1. outgoing tx immediately
        state.txs.unshift({ 
          id: Math.random().toString(36).slice(2), 
          kind: 'sent', 
          amount: fa === 'ZEC' ? -f : -f, 
          asset: fa, 
          time: new Date().toISOString(), 
          shielded: true, 
          status: 'confirmed' 
        });
        
        saveState();
        renderDashboard();

        // 2. incoming tx after 1.5 s (newer timestamp → newest)
        setTimeout(() => {
          state.txs.unshift({ 
            id: Math.random().toString(36).slice(2), 
            kind: 'recv', 
            amount: out, 
            asset: ta, 
            time: new Date().toISOString(), 
            shielded: true, 
            status: 'confirmed' 
          });
          saveState();
          renderDashboard();
        }, 1500);

        setTimeout(() => {
          showToast(`Swapped ${f.toFixed(6)} ${fa} → ${out.toFixed(6)} ${ta}`);
          renderDashboard();
        }, 3000);
      },
      'Swap'
    );
  };
  updateBalances();
  refreshQuote();
}

/* ----------  common  ---------- */
function attachCommon() {
  const privacyToggle = $('#privacyToggle');
  if (privacyToggle && !privacyToggle.onclick) {
    privacyToggle.onclick = () => {
      privacy = !privacy;
      const name = historyStack[historyStack.length - 1];
      if (routes[name]) routes[name]();
    };
  }

  const settingsBtn = $('#settingsBtn');
  if (settingsBtn && !settingsBtn.onclick) {
    settingsBtn.onclick = () => nav('settings');
  }

  const brand = $('.brand');
  if (brand && !brand.onclick) {
    brand.onclick = () => {
      historyStack = ['dashboard'];
      renderDashboard();
    };
  }

  // Generic router for all data-nav buttons
  $$('[data-nav]').forEach((b) => {
    const target = b.getAttribute('data-nav');
    b.onclick = () => {
      if (target === 'back') {
        historyBack(); // default: go to dashboard
      } else if (target === 'settings-back') {
        nav('settings'); // subpages: go back to settings
      } else if (routes[target]) {
        nav(target); // any named route
      } else {
        console.warn('Unknown nav target:', target);
      }
    };
  });
}

function openConfirm(title, html, onOK, okLabel = 'OK') {
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = html;
  $('#modalOK').textContent = okLabel;
  $('#modalBackdrop').classList.remove('hidden');
  $('#modalCancel').onclick = closeModal;
  $('#modalOK').onclick = () => {
    closeModal();
    onOK && onOK();
  };
}
function closeModal() {
  $('#modalBackdrop').classList.add('hidden');
}

function showSendingScreen(toText) {
  $('#modalTitle').textContent = '';
  $('#modalBody').innerHTML = `
    <div class="sending-body">
      <div class="spinner-box">
        <div class="spinner"></div>
        <div class="plane">✈️</div>
      </div>
      <div class="sending-label">Sending…</div>
      <div class="sending-sub">${toText}</div>
    </div>
  `;
  $('#modalOK').style.display = 'none';
  $('#modalCancel').style.display = 'none';
  $('#modalBackdrop').classList.remove('hidden');

  if (!document.getElementById('send-anim-style')) {
    const st = document.createElement('style');
    st.id = 'send-anim-style';
    st.textContent = `
      .sending-body{text-align:center;padding:40px 0}
      .spinner-box{position:relative;width:120px;height:120px;margin:0 auto}
      .spinner{position:absolute;inset:0;border:2px dashed #444;border-radius:50%;animation:spin 2s linear infinite}
      .plane{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:64px;animation:float 2.2s ease-in-out infinite}
      .sending-label{font-size:28px;font-weight:800;margin-top:12px}
      .sending-sub{color:#a3a0a6;margin-top:6px}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes float{0%,100%{transform:translate(-50%,-50%)}50%{transform:translate(-50%,-65%)}}
    `;
    document.head.appendChild(st);
  }

  setTimeout(() => {
    $('#modalOK').style.display = '';
    $('#modalCancel').style.display = '';
    closeModal();
  }, 3000);
}

function randomShielded() {
  const base = 'u1' + Math.random().toString(36).slice(2).padEnd(30, 'x');
  return `${base}${Math.random().toString(36).slice(2)}`.slice(0, 60);
}

/* ----------  init  ---------- */
renderDashboard();