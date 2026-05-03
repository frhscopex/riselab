// Firebase Configuration for Production
const firebaseConfig = {
    apiKey: "AIzaSyBDvHgeXNifruR9MZKTbsHbry_wrqKJBXU",
    authDomain: "website-32bb7.firebaseapp.com",
    projectId: "website-32bb7",
    storageBucket: "website-32bb7.firebasestorage.app",
    messagingSenderId: "481050172900",
    appId: "1:481050172900:web:d539a1a190f1520cd73bf1"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
}

document.addEventListener('DOMContentLoaded', () => {
    const AUTH_API_BASE = window.RISELAB_API_BASE || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:4000' : '');
    
    // Scroll reveal animation
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: Stop observing once revealed
                // observer.unobserve(entry.target);
            }
        });
    };
    
    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };
    
    const revealObserver = new IntersectionObserver(revealCallback, revealOptions);
    
    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if(targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Offset for sticky nav
                    behavior: 'smooth'
                });
            }
        });
    });

    // API Playground Logic
    const apiData = {
        feed: {
            title: "Response: 200 OK",
            code: `{\n  "status": "success",\n  "data": {\n    "freshness": "12m ago",\n    "topic": "Reasoning Models",\n    "articles": [\n      {\n        "title": "Chain-of-Thought Optimization in O1",\n        "key_findings": [\n          "Improves multi-step accuracy by 14%",\n          "Reduces token overhead via pruning"\n        ],\n        "source": "ArXiv",\n        "url": "https://arxiv.org/abs/..."\n      }\n    ]\n  }\n}`
        },
        search: {
            title: "Response: 200 OK",
            code: `{\n  "query": "how to handle stale context?",\n  "results": [\n    {\n      "similarity_score": 0.94,\n      "content": "Use vector-based RAG with time-weighted decay. Older memories lose relevance unless accessed frequently.",\n      "source_type": "documentation",\n      "recommended_action": "Implement exponential decay on memory embeddings."\n    }\n  ]\n}`
        },
        memory: {
            title: "Response: 201 Created",
            code: `{\n  "agent_id": "agt_8f72c1",\n  "action": "memory_stored",\n  "vector_id": "vec_9934",\n  "content": "User prefers concise answers without bullet points.",\n  "timestamp": "2026-05-03T17:15:00Z"\n}`
        },
        sync: {
            title: "Response: 200 OK",
            code: `{\n  "fleet_id": "flt_alpha",\n  "active_agents": 4,\n  "recent_operations": [\n    {\n      "agent": "coder_agent",\n      "action": "refactored index.js",\n      "time": "2m ago"\n    },\n    {\n      "agent": "reviewer_agent",\n      "action": "approved PR #42",\n      "time": "just now"\n    }\n  ],\n  "collision_warnings": 0\n}`
        }
    };

    function syntaxHighlight(json) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }

    const endpoints = document.querySelectorAll('.api-endpoint');
    const codeBlock = document.getElementById('api-code-block');
    const titleBlock = document.getElementById('api-title');
    
    if (endpoints.length && codeBlock) {
        async function updatePlayground(endpointKey) {
            const data = apiData[endpointKey];
            
            // Set loading state
            titleBlock.textContent = "Fetching...";
            codeBlock.innerHTML = '<span class="json-string">"Loading data from RiseLab layer..."</span>';
            
            try {
                let response;
                const baseUrl = 'https://riselab.tech/api';
                
                if (endpointKey === 'feed') {
                    response = await fetch(`${baseUrl}/feed`);
                } else if (endpointKey === 'search') {
                    response = await fetch(`${baseUrl}/search`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: "how to handle stale context?" })
                    });
                } else if (endpointKey === 'memory') {
                    response = await fetch(`${baseUrl}/memory`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            agent_id: "agt_8f72c1",
                            content: "User prefers concise answers without bullet points." 
                        })
                    });
                } else {
                    throw new Error("No backend route for this endpoint yet");
                }

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const responseData = await response.json();
                
                // Success from backend
                titleBlock.textContent = `Response: ${response.status} ${response.statusText || 'OK'}`;
                codeBlock.innerHTML = syntaxHighlight(JSON.stringify(responseData, null, 2));
                
            } catch (error) {
                // Fallback to mock data if backend is offline or errors
                console.log(`Backend fetch failed for ${endpointKey}, using mock data. Error:`, error);
                if (data) {
                    titleBlock.textContent = data.title + " (Mock)";
                    codeBlock.innerHTML = syntaxHighlight(data.code);
                }
            }
        }

        endpoints.forEach(ep => {
            ep.addEventListener('click', () => {
                endpoints.forEach(e => e.classList.remove('active'));
                ep.classList.add('active');
                updatePlayground(ep.dataset.endpoint);
            });
        });

        // Init first tab
        updatePlayground('feed');
    }

    // Modal control functions
    window.openModal = function(type) {
        document.body.style.overflow = 'hidden';
        if (type === 'login') {
            document.getElementById('login-modal').classList.add('active');
            document.getElementById('signup-modal').classList.remove('active');
        } else {
            document.getElementById('signup-modal').classList.add('active');
            document.getElementById('login-modal').classList.remove('active');
        }
    }

    window.closeModals = function() {
        document.body.style.overflow = 'auto';
        document.getElementById('login-modal').classList.remove('active');
        document.getElementById('signup-modal').classList.remove('active');
    }

    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModals();
        });
    });

    // Auth state management
    function updateAuthState() {
        const token = localStorage.getItem('riselab_token');
        let user = null;
        try {
            const storedUser = localStorage.getItem('riselab_user');
            if (storedUser && storedUser !== 'undefined') {
                user = JSON.parse(storedUser);
            }
        } catch (e) {
            console.warn('Failed to parse user from localStorage', e);
            localStorage.removeItem('riselab_user');
            localStorage.removeItem('riselab_token');
        }

        
        const navLinks = document.querySelector('.nav-links');
        const getStartedBtn = document.querySelector('.cta-group .btn-primary');
        
        if (token && user) {
            // Logged in
            if (navLinks) {
                navLinks.innerHTML = `
                    <a href="#features">Features</a>
                    <a href="#comparison">Compare</a>
                    <a href="#api">API</a>
                    <a href="dashboard.html" class="btn btn-primary">Dashboard</a>
                    <a href="#" id="logout-btn" class="btn btn-outline">Logout</a>
                `;
                document.getElementById('logout-btn').addEventListener('click', logout);
            }
            if (getStartedBtn) {
                getStartedBtn.textContent = 'Go to Dashboard';
                getStartedBtn.href = 'dashboard.html';
                getStartedBtn.onclick = null;
            }
        } else {
            // Logged out
            if (navLinks) {
                navLinks.innerHTML = `
                    <a href="#features">Features</a>
                    <a href="#comparison">Compare</a>
                    <a href="#api">API</a>
                    <a href="#" class="btn btn-outline" onclick="openModal('login')">Sign In</a>
                    <a href="#" class="btn btn-primary" onclick="openModal('signup')">Get Started</a>
                `;
            }
            if (getStartedBtn) {
                getStartedBtn.textContent = 'Start Building Free';
                getStartedBtn.href = '#';
                getStartedBtn.onclick = (e) => { e.preventDefault(); openModal('signup'); };
            }
        }
    }

    function logout(e) {
        if(e) e.preventDefault();
        localStorage.removeItem('riselab_token');
        localStorage.removeItem('riselab_user');
        window.location.reload();
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

    async function handleOAuthClick(form, provider, errorEl) {
        try {
            errorEl.style.display = 'none';
            setFormLoading(form, true);

            if (typeof firebase === 'undefined' || !firebase.auth) {
                throw new Error('Firebase SDK is not loaded.');
            }
            
            let authProvider;
            if (provider === 'google') {
                authProvider = new firebase.auth.GoogleAuthProvider();
            } else if (provider === 'github') {
                authProvider = new firebase.auth.GithubAuthProvider();
            } else {
                throw new Error('Unknown provider');
            }

            // 1. Firebase Login Popup
            const result = await firebase.auth().signInWithPopup(authProvider);
            const idToken = await result.user.getIdToken();

            // 2. Exchange Firebase Token for our Backend JWT
            const res = await fetch(`${AUTH_API_BASE}/api/auth/social`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken })
            });

            const raw = await res.text();
            let data = {};
            if (raw) {
                try {
                    data = JSON.parse(raw);
                } catch (_error) {
                    throw new Error(`Auth endpoint returned non-JSON response (HTTP ${res.status}).`);
                }
            }
            if (!res.ok) throw new Error(data.error || 'Social login failed');

            // 3. Save session and redirect
            localStorage.setItem('riselab_token', data.token);
            if (data.user) {
                localStorage.setItem('riselab_user', JSON.stringify(data.user));
            }
            
            closeModals();
            window.location.href = 'dashboard.html';

        } catch (error) {
            console.error('OAuth Error:', error);
            errorEl.textContent = error.message.includes('apiKey') 
                ? "Social Auth config missing. Please update script.js with your Firebase API Key."
                : error.message;
            errorEl.style.display = 'block';
        } finally {
            setFormLoading(form, false);
        }
    }

    // Form handlers
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const signupPassword = document.getElementById('signup-password');
    const passwordStrength = document.getElementById('password-strength');
    const passwordStrengthText = document.getElementById('password-strength-text');

    if (loginForm) {
        const loginError = document.getElementById('login-error');
        loginForm.querySelectorAll('.oauth-btn').forEach((oauthBtn) => {
            oauthBtn.addEventListener('click', () => handleOAuthClick(loginForm, oauthBtn.dataset.provider, loginError));
        });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;
            const errorEl = document.getElementById('login-error');

            try {
                setFormLoading(loginForm, true);
                errorEl.style.display = 'none';

                const res = await fetch(`${AUTH_API_BASE}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const raw = await res.text();
                let data = {};
                if (raw) {
                    try {
                        data = JSON.parse(raw);
                    } catch (_error) {
                        throw new Error(`Auth endpoint returned non-JSON response (HTTP ${res.status}).`);
                    }
                }
                if (!res.ok) throw new Error(data.error || 'Login failed');

                localStorage.setItem('riselab_token', data.token);
                if (data.user) {
                    localStorage.setItem('riselab_user', JSON.stringify(data.user));
                }

                
                closeModals();
                window.location.href = 'dashboard.html';

            } catch (err) {
                errorEl.textContent = err.message;
                errorEl.style.display = 'block';
            } finally {
                setFormLoading(loginForm, false);
            }
        });
    }

    if (signupForm) {
        const signupError = document.getElementById('signup-error');
        signupForm.querySelectorAll('.oauth-btn').forEach((oauthBtn) => {
            oauthBtn.addEventListener('click', () => handleOAuthClick(signupForm, oauthBtn.dataset.provider, signupError));
        });

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = signupForm.querySelector('input[placeholder="John Doe"]').value;
            const email = signupForm.querySelector('input[type="email"]').value;
            const password = signupForm.querySelector('#signup-password').value;
            const errorEl = document.getElementById('signup-error');

            try {
                setFormLoading(signupForm, true);
                errorEl.style.display = 'none';

                const res = await fetch(`${AUTH_API_BASE}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const raw = await res.text();
                let data = {};
                if (raw) {
                    try {
                        data = JSON.parse(raw);
                    } catch (_error) {
                        throw new Error(`Auth endpoint returned non-JSON response (HTTP ${res.status}).`);
                    }
                }
                if (!res.ok) throw new Error(data.error || 'Registration failed');

                localStorage.setItem('riselab_token', data.token);
                if (data.user) {
                    localStorage.setItem('riselab_user', JSON.stringify(data.user));
                }

                
                closeModals();
                window.location.href = 'dashboard.html';

            } catch (err) {
                errorEl.textContent = err.message;
                errorEl.style.display = 'block';
            } finally {
                setFormLoading(signupForm, false);
            }
        });
    }

    if (signupPassword && passwordStrength && passwordStrengthText) {
        const updateStrength = () => {
            const result = evaluatePasswordStrength(signupPassword.value);
            passwordStrength.classList.remove('strength-weak', 'strength-medium', 'strength-strong');
            passwordStrength.classList.add(result.className);
            passwordStrengthText.textContent = result.label;
        };
        signupPassword.addEventListener('input', updateStrength);
        updateStrength();
    }

    // Initialize auth state
    updateAuthState();
});
