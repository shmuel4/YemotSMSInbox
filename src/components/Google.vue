<template>
    <div class="google-contacts-auth">
        <button v-if="!isAuthenticated" @click="initiateLogin" class="google-login-btn">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google icon" />
            התחבר עם Google
        </button>

        <div v-else class="auth-status">
            <div class="status-info">
                <span class="status-text">מחובר לחשבון Google</span>
                <span class="email-text" v-if="userEmail">{{ userEmail }}</span>
            </div>
            <button @click="fetchContacts" class="fetch-btn">טען אנשי קשר</button>
            <button @click="logout" class="logout-btn">התנתק</button>
        </div>

        <div v-if="contacts.length > 0" class="contacts-container">
            <h3>אנשי קשר ({{ contacts.length }})</h3>
            <ul class="contacts-list">
                <li v-for="contact in contacts" :key="contact.resourceName" class="contact-item">
                    <strong>{{ contact.name || 'ללא שם' }}</strong>
                    <span v-if="contact.email">{{ contact.email }}</span>
                    <span v-if="contact.phone">{{ contact.phone }}</span>
                    <button v-if="contact.phone" @click="addContactToSystem(contact.phone, contact.name)"
                        class="add-btn">
                        הוסף למערכת
                    </button>
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// יבוא אמיטר אם הקומפוננטה משתמשת בו
const emit = defineEmits(['refreshMessages']);

// הגדרת משתנים חיוניים - רק Client ID נדרש
const CLIENT_ID = '293453062070-ne2pf11bn93mjr9mka97i484rb150vlt.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/contacts.readonly';
const DISCOVERY_DOC = 'https://people.googleapis.com/$discovery/rest?version=v1';

// משתני מצב
const isAuthenticated = ref(false);
const contacts = ref([]);
const userEmail = ref('');
const accessToken = ref('');
const tokenExpiry = ref(0);
const gapiInitialized = ref(false);
const gsiInitialized = ref(false);

/**
 * שמירת נתוני הטוקן באמצעות ה-API הקיים שלך
 */
const saveGoogleTokenData = async (userData) => {
    try {
        console.log('שומר נתוני Google Token');

        // המרה של האובייקט למחרוזת JSON
        const dataAsString = JSON.stringify(userData);

        // שימוש ב-API הקיים שלך לשמירת הנתונים
        const response = await fetch(`https://www.call2all.co.il/ym/api/UploadTextFile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: `${localStorage.getItem('username')}:${localStorage.getItem('password')}`,
                what: 'ivr2:GoogleToken.txt', // שם הקובץ שבו נשמור את הנתונים
                contents: dataAsString
            })
        });

        if (!response.ok) {
            throw new Error(`שגיאה בשמירת נתונים: ${response.status}`);
        }

        console.log('נתוני Google Token נשמרו בהצלחה');
        return true;
    } catch (error) {
        console.error('שגיאה בשמירת נתוני Google Token:', error);
        return false;
    }
};

/**
 * קבלת נתוני הטוקן מהשרת באמצעות ה-API הקיים שלך
 */
const getGoogleTokenData = async () => {
    try {
        console.log('מנסה לקבל נתוני Google Token מהשרת');

        // שימוש ב-API הקיים שלך לקבלת הנתונים
        const response = await fetch(
            `https://www.call2all.co.il/ym/api/GetTextFile?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}&what=ivr2:GoogleToken.txt`
        );

        if (!response.ok) {
            if (response.status === 404) {
                console.log('לא נמצאו נתוני Google Token');
                return null;
            }
            throw new Error(`שגיאה בקבלת נתונים: ${response.status}`);
        }

        const responseData = await response.json();

        // responseData.contents מכיל את תוכן הקובץ כמחרוזת
        if (responseData && responseData.contents) {
            try {
                const userData = JSON.parse(responseData.contents);
                console.log('נתוני Google Token התקבלו בהצלחה');
                return userData;
            } catch (parseError) {
                console.error('שגיאה בפענוח נתוני JSON:', parseError);
                return null;
            }
        }

        console.log('הנתונים שהתקבלו אינם תקינים');
        return null;
    } catch (error) {
        console.error('שגיאה בקבלת נתוני Google Token:', error);
        return null;
    }
};

/**
 * מחיקת נתוני הטוקן מהשרת
 */
const deleteGoogleTokenData = async () => {
    try {
        console.log('מוחק נתוני Google Token');

        // שמירת קובץ ריק במקום המקורי ישיג את אותה מטרה
        await fetch(`https://www.call2all.co.il/ym/api/UploadTextFile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: `${localStorage.getItem('username')}:${localStorage.getItem('password')}`,
                what: 'ivr2:GoogleToken.txt',
                contents: '' // קובץ ריק
            })
        });

        console.log('נתוני Google Token נמחקו בהצלחה');
        return true;
    } catch (error) {
        console.error('שגיאה במחיקת נתוני Google Token:', error);
        return false;
    }
};

/**
 * פונקציה להוספת איש קשר למערכת שלך
 */
const addContactToSystem = async (phone, name) => {
    if (!phone) {
        console.error('מספר טלפון חסר');
        return;
    }

    try {
        const contactsFetch = await fetch(
            `https://www.call2all.co.il/ym/api/GetTextFile?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}&what=ivr2:YemotSMSInboxContacts.ini`
        );

        const contactsRes = await contactsFetch.json();
        const contacts = JSON.parse(contactsRes.contents);
        contacts[phone] = name || 'ללא שם';

        await fetch(`https://www.call2all.co.il/ym/api/UploadTextFile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: `${localStorage.getItem('username')}:${localStorage.getItem('password')}`,
                what: 'ivr2:YemotSMSInboxContacts.ini',
                contents: JSON.stringify(contacts)
            })
        });

        console.log(`איש הקשר ${name} נוסף בהצלחה`);
        emit('refreshMessages'); // אמיטר לרענון ההודעות
    } catch (error) {
        console.error('שגיאה בהוספת איש הקשר:', error);
        alert('שגיאה בהוספת איש הקשר: ' + error.message);
    }
};

// טעינת ספריות Google API
onMounted(() => {
    console.log('אתחול קומפוננטת Google Contacts');

    // טעינת גוגל API
    const script1 = document.createElement('script');
    script1.src = 'https://apis.google.com/js/api.js';
    script1.async = true;
    script1.defer = true;
    script1.onload = () => {
        console.log('GAPI נטען');
        initializeGapiClient();
    };
    script1.onerror = () => {
        console.error('שגיאה בטעינת GAPI');
    };
    document.head.appendChild(script1);

    // טעינת גוגל Identity Services
    const script2 = document.createElement('script');
    script2.src = 'https://accounts.google.com/gsi/client';
    script2.async = true;
    script2.defer = true;
    script2.onload = () => {
        console.log('GSI נטען');
        initializeGsiClient();
    };
    script2.onerror = () => {
        console.error('שגיאה בטעינת GSI');
    };
    document.head.appendChild(script2);
});

// אתחול GAPI Client
const initializeGapiClient = async () => {
    try {
        console.log('אתחול GAPI Client');

        await new Promise((resolve) => {
            gapi.load('client', resolve);
        });

        await gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC],
        });

        gapiInitialized.value = true;
        console.log('GAPI אותחל בהצלחה');
        checkApiReady();
    } catch (error) {
        console.error('שגיאה באתחול GAPI:', error.message);
    }
};

// אתחול GSI Client
const initializeGsiClient = () => {
    try {
        console.log('אתחול GSI Client');

        if (!google || !google.accounts) {
            console.error('ספריית google.accounts לא נטענה כראוי');
            return;
        }

        gsiInitialized.value = true;
        console.log('GSI אותחל בהצלחה');
        checkApiReady();
    } catch (error) {
        console.error('שגיאה באתחול GSI:', error.message);
    }
};

// בדיקה אם API מוכנים וטעינת נתונים שמורים
const checkApiReady = async () => {
    if (gapiInitialized.value && gsiInitialized.value) {
        console.log('כל ה-API מוכנים לשימוש');

        // בדיקה אם יש נתוני טוקן שמורים
        const userData = await getGoogleTokenData();

        if (userData && userData.token) {
            console.log('נמצא טוקן שמור בשרת');

            // בדיקה אם הטוקן עדיין בתוקף
            if (userData.tokenExpiry && new Date(userData.tokenExpiry).getTime() > Date.now()) {
                accessToken.value = userData.token;
                tokenExpiry.value = new Date(userData.tokenExpiry).getTime();
                userEmail.value = userData.userEmail || '';

                // הגדרת הטוקן ב-GAPI
                gapi.client.setToken({ access_token: accessToken.value });

                isAuthenticated.value = true;
                console.log('משתמש מחובר באמצעות טוקן שמור');

                // קבלת אנשי קשר באופן אוטומטי
                fetchContacts();
            } else {
                console.log('נמצא טוקן שמור אך פג תוקפו');
                isAuthenticated.value = false;
            }
        } else {
            console.log('לא נמצאו נתוני טוקן שמורים');
        }
    }
};

// התחלת תהליך התחברות
const initiateLogin = () => {
    console.log('מתחיל בתהליך התחברות');

    try {
        const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (response) => {
                if (response.error) {
                    console.error('שגיאה בהתחברות:', response.error);
                    return;
                }

                // שמירת הטוקן והפעלת התהליך
                handleTokenResponse(response);
            }
        });

        // פתיחת חלון התחברות
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (error) {
        console.error('שגיאה בהתחברות:', error.message);
    }
};

// טיפול בטוקן שהתקבל
const handleTokenResponse = async (response) => {
    try {
        console.log('התקבל טוקן מגוגל');

        if (response && response.access_token) {
            // שמירת הנתונים לשימוש בקוד
            accessToken.value = response.access_token;
            tokenExpiry.value = Date.now() + (response.expires_in * 1000);

            // הגדרת הטוקן ב-GAPI לשימוש בבקשות
            gapi.client.setToken({ access_token: response.access_token });

            isAuthenticated.value = true;

            // קבל מידע על המשתמש
            await getUserInfo();

            // שמירת הנתונים בשרת
            await saveGoogleTokenData({
                token: accessToken.value,
                tokenExpiry: new Date(tokenExpiry.value).toISOString(),
                userEmail: userEmail.value
            });
        } else {
            console.error('לא התקבל טוקן תקף');
        }
    } catch (error) {
        console.error('שגיאה בטיפול בטוקן:', error.message);
    }
};

// קבלת מידע על המשתמש
const getUserInfo = async () => {
    try {
        console.log('מנסה לקבל מידע על המשתמש');

        const response = await gapi.client.people.people.get({
            resourceName: 'people/me',
            personFields: 'emailAddresses,names',
        });

        console.log('התקבל מידע משתמש');

        if (response.result && response.result.emailAddresses && response.result.emailAddresses.length > 0) {
            userEmail.value = response.result.emailAddresses[0].value;
            console.log('המייל של המשתמש:', userEmail.value);

            // שמירת המידע המעודכן בשרת
            await saveGoogleTokenData({
                token: accessToken.value,
                tokenExpiry: new Date(tokenExpiry.value).toISOString(),
                userEmail: userEmail.value
            });

            // אם הצלחנו לקבל מידע משתמש, ננסה לקבל אנשי קשר
            fetchContacts();
        }
    } catch (error) {
        console.error('שגיאה בקבלת מידע משתמש:', error.message || JSON.stringify(error));

        // אם יש שגיאת 401, הטוקן לא תקף
        if (error.status === 401 || (error.result && error.result.error && error.result.error.code === 401)) {
            console.error('הטוקן אינו תקף - יש להתחבר מחדש');
            isAuthenticated.value = false;
        }
    }
};

// קבלת רשימת אנשי קשר
const fetchContacts = async () => {
    try {
        console.log('מנסה לקבל אנשי קשר');

        // בדיקה אם יש טוקן תקף
        if (!accessToken.value) {
            const userData = await getGoogleTokenData();
            if (userData && userData.token && userData.tokenExpiry && new Date(userData.tokenExpiry).getTime() > Date.now()) {
                // שימוש בטוקן השמור
                accessToken.value = userData.token;
                tokenExpiry.value = new Date(userData.tokenExpiry).getTime();
                gapi.client.setToken({ access_token: accessToken.value });
            } else {
                console.error('אין טוקן תקף - יש להתחבר מחדש');
                isAuthenticated.value = false;
                return;
            }
        }

        console.log('שולח בקשה לקבלת אנשי קשר');

        // בקשה מפורשת עם הגדרת headers לאימות
        const response = await gapi.client.request({
            path: 'https://people.googleapis.com/v1/people/me/connections',
            method: 'GET',
            params: {
                personFields: 'names,emailAddresses,phoneNumbers',
                pageSize: 100
            },
            headers: {
                'Authorization': `Bearer ${accessToken.value}`
            }
        });

        console.log('תשובה התקבלה:', response.status);

        // עיבוד התוצאות
        if (response.result && response.result.connections) {
            console.log(`נמצאו ${response.result.connections.length} אנשי קשר`);

            contacts.value = response.result.connections.map(person => {
                return {
                    resourceName: person.resourceName,
                    name: person.names && person.names.length > 0 ? person.names[0].displayName : 'ללא שם',
                    email: person.emailAddresses && person.emailAddresses.length > 0 ? person.emailAddresses[0].value : '',
                    phone: person.phoneNumbers && person.phoneNumbers.length > 0 ? person.phoneNumbers[0].value : ''
                };
            });
        } else {
            console.log('לא נמצאו אנשי קשר');
            contacts.value = [];
        }
    } catch (error) {
        // לוג מפורט יותר של השגיאה
        console.error('שגיאה בטעינת אנשי קשר:', error.message || JSON.stringify(error));

        // הצגת פרטי שגיאה מלאים
        if (error.result && error.result.error) {
            console.error(`קוד שגיאה: ${error.result.error.code}, סיבה: ${error.result.error.message}`);

            // אם הטוקן לא תקף
            if (error.result.error.code === 401) {
                console.error('הטוקן אינו תקף - יש להתחבר מחדש');
                isAuthenticated.value = false;
                await deleteGoogleTokenData(); // מחיקת נתוני טוקן לא תקפים
            }
        }
    }
};

// התנתקות וניקוי נתונים
const logout = async () => {
    console.log('מתנתק מחשבון Google');

    try {
        // רק אם יש google.accounts.oauth2
        if (google && google.accounts && google.accounts.oauth2) {
            google.accounts.oauth2.revoke(accessToken.value, () => {
                console.log('טוקן בוטל בהצלחה');
            });
        }

        // ניקוי GAPI
        if (gapi && gapi.client) {
            gapi.client.setToken(null);
        }
    } catch (error) {
        console.warn('שגיאה בהתנתקות:', error.message);
    }

    // מחיקת נתוני הטוקן מהשרת
    await deleteGoogleTokenData();

    // איפוס משתנים
    accessToken.value = '';
    tokenExpiry.value = 0;
    isAuthenticated.value = false;
    userEmail.value = '';
    contacts.value = [];

    console.log('התנתקות הושלמה');
};
</script>

<style scoped>
.google-contacts-auth {
    font-family: Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    direction: rtl;
}

.google-login-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #ffffff;
    color: #555555;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 8px 16px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.google-login-btn img {
    height: 18px;
    margin-left: 8px;
}

.google-login-btn:hover {
    background-color: #f5f5f5;
}

.auth-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #f9f9f9;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 20px;
}

.status-info {
    display: flex;
    flex-direction: column;
}

.status-text {
    font-weight: bold;
    color: #4285F4;
}

.email-text {
    font-size: 12px;
    color: #666;
}

.fetch-btn,
.logout-btn {
    padding: 6px 12px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-size: 14px;
    margin-right: 8px;
}

.fetch-btn {
    background-color: #4285F4;
    color: white;
}

.logout-btn {
    background-color: #f5f5f5;
    color: #666;
}

.contacts-container {
    margin-top: 20px;
}

.contacts-list {
    list-style: none;
    padding: 0;
}

.contact-item {
    padding: 10px;
    border-bottom: 1px solid #eee;
    display: flex;
    flex-direction: column;
}

.contact-item strong {
    margin-bottom: 4px;
}

.contact-item span {
    font-size: 13px;
    color: #666;
}

.add-btn {
    margin-top: 5px;
    align-self: flex-start;
    padding: 3px 8px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
}

.add-btn:hover {
    background-color: #45a049;
}
</style>