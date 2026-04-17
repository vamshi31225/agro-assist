// notifications.js - Smart Notification System Module
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject Bell UI into nav safely
    const nav = document.querySelector('nav');
    if (!nav) return;

    const bellContainer = document.createElement('div');
    bellContainer.style.position = 'relative';
    bellContainer.style.display = 'inline-block';
    bellContainer.style.marginLeft = '15px';
    bellContainer.style.cursor = 'pointer';

    bellContainer.innerHTML = `
        <div id="notif-bell" style="position: relative; font-size: 1.2rem; color: #2e7d32; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: white; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: 0.3s; border: 1px solid #2e7d32;">
            <i class="fa-solid fa-bell"></i>
            <span id="notif-badge" style="display:none; position: absolute; top: -5px; right: -5px; background: #d32f2f; color: white; border-radius: 50%; padding: 2px 6px; font-size: 0.7rem; font-weight: bold;">0</span>
        </div>
        <div id="notif-dropdown" style="display: none; position: absolute; right: 0; top: 50px; width: 320px; background: white; border-radius: 8px; box-shadow: 0 8px 25px rgba(0,0,0,0.2); z-index: 9999; overflow: hidden; border: 1px solid #ddd; text-align: left;">
            <div style="padding: 12px; background: #2e7d32; color: white; font-weight: bold; text-align: center; font-size: 1.1rem; border-bottom: 2px solid #1b5e20;">Notifications Center</div>
            <div id="notif-list" style="max-height: 350px; overflow-y: auto; padding: 0; font-size: 0.95rem; color: #333;">
                <div style="text-align:center; padding: 15px; color:#777;">Loading...</div>
            </div>
            <div style="padding: 10px; text-align: center; border-top: 1px solid #eee; background: #fdfdfd;">
                <button id="notif-mark-read" style="background: #1565c0; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-weight: bold; width: 100%; transition: background 0.3s;">Mark all as read</button>
            </div>
        </div>
    `;

    // Append without destroying existing nav elements
    nav.appendChild(bellContainer);

    // 2. Dropdown Interaction
    const bellBtn = document.getElementById('notif-bell');
    const dropdown = document.getElementById('notif-dropdown');
    
    bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpening = dropdown.style.display === 'none';
        dropdown.style.display = isOpening ? 'block' : 'none';
        if (isOpening) {
            fetchNotifications();
        }
    });

    document.addEventListener('click', (e) => {
        if (!bellContainer.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });

    bellBtn.addEventListener('mouseenter', () => bellBtn.style.background = '#e8f5e9');
    bellBtn.addEventListener('mouseleave', () => bellBtn.style.background = 'white');

    // 3. API interactions (Mark as Read)
    document.getElementById('notif-mark-read').addEventListener('click', async () => {
        const unreadIds = window.currentUnreadNotifs || [];
        if (unreadIds.length === 0) return;
        
        try {
            await fetch('/api/notifications/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationIds: unreadIds })
            });
            fetchNotifications();
        } catch(e) { console.error('Error marking as read', e); }
    });

    // 4. Fetch and render Notifications
    async function fetchNotifications() {
        try {
            // Check login first implicitly
            const res = await fetch('/api/notifications');
            if (res.status === 401) {
                document.getElementById('notif-list').innerHTML = '<div style="text-align:center; padding: 15px; color:#d32f2f;">Please login to view notifications</div>';
                return;
            }
            if (!res.ok) throw new Error('Fetch Error');
            const data = await res.json();
            
            const list = document.getElementById('notif-list');
            const badge = document.getElementById('notif-badge');
            
            list.innerHTML = '';
            let unreadCount = 0;
            window.currentUnreadNotifs = [];

            if (data.length === 0) {
                list.innerHTML = '<div style="text-align:center; padding: 25px; color:#888;">No recent alerts<br><i class="fa-solid fa-box-open" style="font-size: 2rem; margin-top: 10px; color: #ccc;"></i></div>';
            } else {
                data.forEach(n => {
                    if (!n.isRead) {
                        unreadCount++;
                        window.currentUnreadNotifs.push(n._id);
                    }
                    const item = document.createElement('div');
                    item.style.padding = '12px 15px';
                    item.style.borderBottom = '1px solid #eee';
                    item.style.background = n.isRead ? 'white' : '#f4fafd';
                    item.style.color = n.isRead ? '#666' : '#222';
                    
                    let icon = '<i class="fa-solid fa-circle-info" style="color: #1976d2"></i>';
                    if(n.type === 'weather') icon = '<i class="fa-solid fa-cloud-bolt" style="color: #f57c00"></i>';
                    if(n.type === 'price') icon = '<i class="fa-solid fa-chart-line" style="color: #388e3c"></i>';
                    if(n.type === 'disease') icon = '<i class="fa-solid fa-bug" style="color: #d32f2f"></i>';

                    item.innerHTML = `
                        <div style="display: flex; gap: 10px; align-items: flex-start;">
                            <div style="font-size: 1.2rem; margin-top: 2px;">${icon}</div>
                            <div>
                                <div style="font-weight: ${n.isRead ? 'normal' : 'bold'}; margin-bottom: 4px; line-height: 1.4;">${n.message}</div>
                                <div style="font-size:0.75rem; color:#999;">${new Date(n.createdAt).toLocaleDateString()} ${new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            </div>
                        </div>
                    `;
                    list.appendChild(item);
                });
            }

            if (unreadCount > 0) {
                badge.innerText = unreadCount > 9 ? '9+' : unreadCount;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }

        } catch(e) {
            console.error('Notification system fetch error (Silenced):', e);
        }
    }

    // Initialize systems
    initPushNotifications();
    fetchNotifications();

    // Background polling for real-time update feel (every 1 minute)
    setInterval(fetchNotifications, 60000);
});

async function initPushNotifications() {
    // 5. Ask Permission safely & Register Mock FCM
    try {
        if (!("Notification" in window)) {
            console.log("Browser does not support desktop notification");
            return;
        }

        // Only ask if not previously denied
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") return;
        }

        if (Notification.permission === "granted") {
            // Register isolated Service Worker
            if ('serviceWorker' in navigator) {
                await navigator.serviceWorker.register('/sw.js');
                console.log('Firebase/FCM Mock Worker Engine Registered');
                
                // Mock Token exchange (Simulates Firebase Admin Setup without crashing actual environment)
                const mockToken = "fcm_token_" + Math.random().toString(36).substr(2);
                
                // Sync to backend DB quietly
                await fetch('/api/notifications/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        endpoint: "mock_fcm_endpoint_url",
                        keys: { auth: "fcm_auth", p256dh: "fcm_key" },
                        fcmToken: mockToken
                    })
                });
            }
        }
    } catch (e) {
        console.error("FCM Initializer Error (Silenced via constraint):", e);
    }
}
