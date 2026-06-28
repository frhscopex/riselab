document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('riselab_token');
    let user = null;
    try {
        const storedUser = localStorage.getItem('riselab_user');
        if (storedUser && storedUser !== 'undefined') {
            user = JSON.parse(storedUser);
        }
    } catch (e) {
        console.error('Failed to parse user from localStorage', e);
    }
    
    const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:4000/api' 
        : '/api';

    if (!token || !user) {
        window.location.href = 'index.html';
        return;
    }

    function clearSessionAndRedirect() {
        localStorage.removeItem('riselab_token');
        localStorage.removeItem('riselab_user');
        window.location.href = 'index.html';
    }

    async function parseApiResponse(res) {
        const raw = await res.text();
        let body = {};

        if (raw) {
            try {
                body = JSON.parse(raw);
            } catch (_error) {
                body = {
                    error: `Server returned an invalid response (HTTP ${res.status}).`,
                    raw,
                };
            }
        }

        if (!res.ok) {
            const message = body.error || body.message || `Request failed (HTTP ${res.status})`;
            const err = new Error(message);
            err.status = res.status;
            err.body = body;
            throw err;
        }

        return body;
    }

    function setFormLoading(form, isLoading) {
        const buttons = form.querySelectorAll('button');
        buttons.forEach((btn) => {
            if (isLoading) {
                if (!btn.dataset.defaultHtml) {
                    btn.dataset.defaultHtml = btn.innerHTML;
                }
                const loadingText = btn.dataset.loadingText || 'Please wait...';
                btn.disabled = true;
                btn.classList.add('is-loading');
                btn.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span><span>${loadingText}</span>`;
            } else {
                btn.disabled = false;
                btn.classList.remove('is-loading');
                if (btn.dataset.defaultHtml) {
                    btn.innerHTML = btn.dataset.defaultHtml;
                }
            }
        });
    }

    function evaluatePasswordStrength(value) {
        let score = 0;
        if (value.length >= 8) score += 1;
        if (/[a-z]/.test(value)) score += 1;
        if (/[A-Z]/.test(value)) score += 1;
        if (/\d/.test(value)) score += 1;
        if (/[^A-Za-z0-9]/.test(value)) score += 1;

        if (score <= 2) return { className: 'strength-weak', label: 'Weak password' };
        if (score <= 4) return { className: 'strength-medium', label: 'Medium password' };
        return { className: 'strength-strong', label: 'Strong password' };
    }

    // Update User Info
    const displayName = user.name || user.email || 'User';
    document.querySelector('.user-name').textContent = displayName;
    document.querySelector('.avatar').textContent = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    // Fetch Billing Status
    async function fetchBilling() {
        try {
            const res = await fetch(`${apiBaseUrl}/billing/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await parseApiResponse(res);
            if (data && data.data) {
                const plan = (data.data.plan || 'free').toLowerCase();
                document.querySelector('.user-plan').textContent = (plan.charAt(0).toUpperCase() + plan.slice(1)) + ' Plan';
                
                const upgradeBtn = document.getElementById('upgrade-btn');
                if (upgradeBtn) {
                    if (plan === 'pro' || plan === 'enterprise') {
                        upgradeBtn.textContent = 'Manage';
                    } else {
                        upgradeBtn.textContent = 'Upgrade';
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch billing:', err);
            if (err.status === 401) {
                showNotification('Your session expired. Please sign in again.', 'error');
                clearSessionAndRedirect();
                return;
            }
            showNotification('Unable to load billing status right now.', 'error');
        }
    }

    async function handleUpgrade(plan = 'pro') {
        const upgradeBtn = document.getElementById('upgrade-btn');
        const originalText = upgradeBtn ? upgradeBtn.textContent : 'Upgrade';
        
        try {
            if (upgradeBtn) {
                upgradeBtn.disabled = true;
                upgradeBtn.textContent = '...';
            }

            const res = await fetch(`${apiBaseUrl}/stripe/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ plan })
            });

            const data = await parseApiResponse(res);

            // Redirect to Stripe
            window.location.href = data.url;

        } catch (err) {
            console.error('Upgrade error:', err);
            showNotification(err.message, 'error');
            if (upgradeBtn) {
                upgradeBtn.disabled = false;
                upgradeBtn.textContent = originalText;
            }
        }
    }

    function showNotification(message, type = 'success') {
        const notify = document.getElementById('stripe-notification');
        if (!notify) return;
        
        notify.textContent = message;
        notify.className = `stripe-notification ${type}`;
        notify.style.display = 'block';
        
        setTimeout(() => {
            notify.style.display = 'none';
        }, 5000);
    }

    // Check for session_id in URL (returned from Stripe)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('session_id')) {
        showNotification('Successfully upgraded! Your new features are now active.');
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const upgradeBtn = document.getElementById('upgrade-btn');
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', () => handleUpgrade('pro'));
    }

    // Generate API Key
    const createKeyBtn = document.querySelector('.section-heading .btn-sm');
    if (createKeyBtn) {
        createKeyBtn.addEventListener('click', async () => {
            const name = prompt('Enter a name for your new agent:');
            if (!name) return;

            try {
                createKeyBtn.disabled = true;
                createKeyBtn.textContent = 'Generating...';

                const res = await fetch(`${apiBaseUrl}/keys/generate`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ name })
                });

                const data = await parseApiResponse(res);
                prependApiKeyRow(name, data.data.apiKey);

            } catch (err) {
                alert('Error: ' + err.message);
            } finally {
                createKeyBtn.disabled = false;
                createKeyBtn.textContent = 'Create Key';
            }
        });
    }

    // Logout
    // Add a real logout in the sidebar footer
    const sidebarFooter = document.querySelector('.sidebar-footer');
    const logoutLink = document.createElement('a');
    logoutLink.href = '#';
    logoutLink.className = 'nav-item';
    logoutLink.style.marginTop = '10px';
    logoutLink.style.color = '#ff4d4d';
    logoutLink.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
    logoutLink.onclick = (e) => {
        e.preventDefault();
        localStorage.removeItem('riselab_token');
        localStorage.removeItem('riselab_user');
        window.location.href = 'index.html';
    };
    sidebarFooter.appendChild(logoutLink);

    window.closeDashboardAuthModals = function() {
        document.querySelectorAll('#dashboard-login-modal, #dashboard-signup-modal')
            .forEach((modal) => modal.classList.remove('active'));
        document.body.style.overflow = 'auto';
    };

    const dashboardLoginForm = document.getElementById('dashboard-login-form');
    const dashboardSignupForm = document.getElementById('dashboard-signup-form');
    const recentActivityFeed = document.getElementById('recent-activity-feed');
    const knowledgeResults = document.getElementById('knowledge-results');
    const knowledgeSearchForm = document.getElementById('knowledge-search-form');
    const knowledgeSearchInput = document.getElementById('knowledge-search-input');

    function formatDateTime(dateValue) {
        const dt = new Date(dateValue);
        if (Number.isNaN(dt.getTime())) return 'Unknown time';
        return dt.toLocaleString();
    }

    function attachCopyHandlers() {
        document.querySelectorAll('.copy-key-btn').forEach((btn) => {
            if (btn.dataset.bound === '1') return;
            btn.dataset.bound = '1';

            btn.addEventListener('click', async () => {
                const row = btn.closest('.api-key-item');
                const valueNode = row ? row.querySelector('.key-value') : null;
                const keyToCopy = valueNode ? (valueNode.dataset.fullKey || valueNode.textContent || '').trim() : '';

                if (!keyToCopy) return;

                const originalHtml = btn.innerHTML;
                try {
                    await navigator.clipboard.writeText(keyToCopy);
                    btn.classList.add('success');
                    btn.innerHTML = '<i class="fas fa-check"></i>';
                } catch (_error) {
                    btn.innerHTML = '<i class="fas fa-times"></i>';
                } finally {
                    setTimeout(() => {
                        btn.classList.remove('success');
                        btn.innerHTML = originalHtml;
                    }, 1200);
                }
            });
        });
    }

    function prependApiKeyRow(name, fullKey) {
        const list = document.querySelector('.api-key-list');
        if (!list) return;

        const masked = `${fullKey.slice(0, 7)}${'*'.repeat(Math.max(fullKey.length - 11, 4))}${fullKey.slice(-4)}`;
        const item = document.createElement('div');
        item.className = 'api-key-item';
        item.innerHTML = `
            <div class="key-details">
                <span class="key-name">${name}</span>
                <span class="key-value" data-full-key="${fullKey}">${masked}</span>
            </div>
            <div class="key-actions">
                <button class="action-btn copy-key-btn" aria-label="Copy API key"><i class="fas fa-copy"></i></button>
                                <button class="action-btn danger" aria-label="Delete API key"><i class="fas fa-trash"></i></button>
            </div>
        `;

        list.prepend(item);
        attachCopyHandlers();
    }

    async function fetchRecentActivity() {
        if (!recentActivityFeed) return;

        try {
            const res = await fetch(`${apiBaseUrl}/memory?limit=5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const payload = await parseApiResponse(res);

            const items = payload.data || [];
            if (!items.length) {
                recentActivityFeed.innerHTML = '<li class="activity-empty">No memory logs yet.</li>';
                return;
            }

            recentActivityFeed.innerHTML = items.map((item) => `
                <li>
                    <div class="activity-icon"><i class="fas fa-pencil-alt"></i></div>
                    <div class="activity-details">
                        <p><strong>Agent</strong> logged memory: <em>${item.content}</em></p>
                        <span class="time">${formatDateTime(item.createdAt || item.created_at)}</span>
                    </div>
                </li>
            `).join('');
        } catch (_err) {
            recentActivityFeed.innerHTML = '<li class="activity-empty">Activity feed is offline.</li>';
        }
    }

    function renderKnowledgeCards(items) {
        if (!knowledgeResults) return;
        if (!items.length) {
            knowledgeResults.innerHTML = '<div class="knowledge-empty">No knowledge entries found.</div>';
            return;
        }

        knowledgeResults.innerHTML = items.map((item) => `
            <article class="knowledge-card">
                <h3>${item.title || 'Untitled'}</h3>
                <p>${item.summary || ''}</p>
                <div class="knowledge-meta">
                    <span>${item.source || 'Unknown source'}</span>
                    <span>${formatDateTime(item.date)}</span>
                </div>
            </article>
        `).join('');
    }

    async function loadKnowledgeFeed() {
        if (!knowledgeResults) return;
        try {
            const res = await fetch(`${apiBaseUrl}/feed`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const payload = await parseApiResponse(res);
            renderKnowledgeCards(payload.data || []);
        } catch (_error) {
            knowledgeResults.innerHTML = '<div class="knowledge-empty">Knowledge feed is offline.</div>';
        }
    }

    async function searchKnowledge(query) {
        if (!knowledgeResults) return;
        try {
            const res = await fetch(`${apiBaseUrl}/search?q=${encodeURIComponent(query)}&limit=8`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const payload = await parseApiResponse(res);
            renderKnowledgeCards(payload.results || []);
        } catch (_error) {
            knowledgeResults.innerHTML = '<div class="knowledge-empty">Search is currently unavailable.</div>';
        }
    }

    if (dashboardLoginForm) {
        const loginError = document.getElementById('dashboard-login-error');

        dashboardLoginForm.querySelectorAll('.oauth-btn').forEach((oauthBtn) => {
            oauthBtn.addEventListener('click', async () => {
                loginError.style.display = 'none';
                setFormLoading(dashboardLoginForm, true);
                await new Promise((resolve) => setTimeout(resolve, 900));
                loginError.textContent = `${oauthBtn.dataset.provider === 'google' ? 'Google' : 'GitHub'} OAuth is coming soon.`;
                loginError.style.display = 'block';
                setFormLoading(dashboardLoginForm, false);
            });
        });

        dashboardLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginError.style.display = 'none';
            setFormLoading(dashboardLoginForm, true);
            await new Promise((resolve) => setTimeout(resolve, 900));
            loginError.textContent = 'Session-based login from dashboard will be enabled in the next update.';
            loginError.style.display = 'block';
            setFormLoading(dashboardLoginForm, false);
        });
    }

    if (dashboardSignupForm) {
        const signupError = document.getElementById('dashboard-signup-error');
        const passwordInput = document.getElementById('dashboard-signup-password');
        const strengthContainer = document.getElementById('dashboard-password-strength');
        const strengthText = document.getElementById('dashboard-password-strength-text');

        dashboardSignupForm.querySelectorAll('.oauth-btn').forEach((oauthBtn) => {
            oauthBtn.addEventListener('click', async () => {
                signupError.style.display = 'none';
                setFormLoading(dashboardSignupForm, true);
                await new Promise((resolve) => setTimeout(resolve, 900));
                signupError.textContent = `${oauthBtn.dataset.provider === 'google' ? 'Google' : 'GitHub'} OAuth is coming soon.`;
                signupError.style.display = 'block';
                setFormLoading(dashboardSignupForm, false);
            });
        });

        dashboardSignupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            signupError.style.display = 'none';
            setFormLoading(dashboardSignupForm, true);
            await new Promise((resolve) => setTimeout(resolve, 900));
            signupError.textContent = 'Dashboard signup flow is a placeholder until social auth backend is connected.';
            signupError.style.display = 'block';
            setFormLoading(dashboardSignupForm, false);
        });

        if (passwordInput && strengthContainer && strengthText) {
            const updateStrength = () => {
                const result = evaluatePasswordStrength(passwordInput.value);
                strengthContainer.classList.remove('strength-weak', 'strength-medium', 'strength-strong');
                strengthContainer.classList.add(result.className);
                strengthText.textContent = result.label;
            };

            passwordInput.addEventListener('input', updateStrength);
            updateStrength();
        }
    }

    if (knowledgeSearchForm && knowledgeSearchInput) {
        knowledgeSearchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const query = knowledgeSearchInput.value.trim();
            if (!query) {
                await loadKnowledgeFeed();
                return;
            }
            await searchKnowledge(query);
        });
    }

    attachCopyHandlers();
    fetchRecentActivity();
    loadKnowledgeFeed();
    fetchBilling();
});
