<template>
    <transition name="fade">
        <div v-if="privacyPolicyVisible"
            class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
            style="backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);" @click="closePrivacyPolicy">

            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden" @click.stop>
                <!-- Header -->
                <div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 relative">
                    <button @click="closePrivacyPolicy"
                        class="absolute top-4 left-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                    <div class="text-center">
                        <h1 class="text-3xl font-bold mb-2">מדיניות פרטיות</h1>
                        <p class="text-indigo-100">מערכת ניהול הודעות SMS</p>
                        <div class="mt-3 inline-block bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm">
                            עדכון אחרון: יוני 2025
                        </div>
                    </div>
                </div>

                <!-- Content -->
                <div class="overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-8">
                    <!-- מבוא -->
                    <section class="bg-blue-50 p-6 rounded-xl border-r-4 border-blue-400">
                        <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                            <svg class="w-6 h-6 ml-3 text-blue-600" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            מבוא
                        </h2>
                        <p class="text-gray-700 leading-relaxed">
                            אפליקציה זו מאפשרת לך לנהל הודעות SMS באמצעות חיבור ישיר לשירותי ימות המשיח בע"מ.
                            אנו מחויבים להגנה על פרטיותך ושקיפות מלאה בנוגע לאופן השימוש במידע שלך.
                        </p>
                    </section>

                    <!-- איסוף מידע -->
                    <section>
                        <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                            <svg class="w-6 h-6 ml-3 text-green-600" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            איסוף מידע
                        </h2>

                        <div class="grid md:grid-cols-2 gap-6">
                            <div class="bg-green-50 p-5 rounded-xl">
                                <h3 class="font-semibold text-green-800 mb-3 flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full ml-2"></span>
                                    נתונים שאנו אוספים
                                </h3>
                                <ul class="space-y-2 text-sm text-gray-700">
                                    <li class="flex items-start">
                                        <span class="text-green-500 ml-2">•</span>
                                        <span><strong>פרטי התחברות:</strong> מספר מערכת וסיסמה לימות המשיח</span>
                                    </li>
                                    <li class="flex items-start">
                                        <span class="text-green-500 ml-2">•</span>
                                        <span><strong>הודעות SMS:</strong> תוכן ההודעות שאתה שולח ומקבל</span>
                                    </li>
                                    <li class="flex items-start">
                                        <span class="text-green-500 ml-2">•</span>
                                        <span><strong>אנשי קשר:</strong> שמות ומספרי טלפון (אופציונלי מ-Google)</span>
                                    </li>
                                    <li class="flex items-start">
                                        <span class="text-green-500 ml-2">•</span>
                                        <span><strong>טוקן Google:</strong> עבור סנכרון אנשי קשר (אם בחרת)</span>
                                    </li>
                                </ul>
                            </div>

                            <div class="bg-amber-50 p-5 rounded-xl">
                                <h3 class="font-semibold text-amber-800 mb-3 flex items-center">
                                    <span class="w-2 h-2 bg-amber-500 rounded-full ml-2"></span>
                                    איפה נשמר המידע
                                </h3>
                                <ul class="space-y-2 text-sm text-gray-700">
                                    <li class="flex items-start">
                                        <span class="text-amber-500 ml-2">•</span>
                                        <span><strong>מקומי בדפדפן:</strong> פרטי התחברות בלבד</span>
                                    </li>
                                    <li class="flex items-start">
                                        <span class="text-amber-500 ml-2">•</span>
                                        <span><strong>שרתי ימות המשיח:</strong> הודעות SMS ואנשי קשר</span>
                                    </li>
                                    <li class="flex items-start">
                                        <span class="text-amber-500 ml-2">•</span>
                                        <span><strong>Google APIs:</strong> טוקן גישה זמני לאנשי קשר</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <!-- שימוש במידע -->
                    <section>
                        <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                            <svg class="w-6 h-6 ml-3 text-purple-600" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z">
                                </path>
                            </svg>
                            איך אנו משתמשים במידע
                        </h2>

                        <div class="grid md:grid-cols-3 gap-4">
                            <div
                                class="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
                                <div class="text-blue-600 mb-3">
                                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z">
                                        </path>
                                    </svg>
                                </div>
                                <h3 class="font-semibold text-gray-800 mb-2">הצגת הודעות</h3>
                                <p class="text-sm text-gray-600">ארגון והצגת השיחות שלך בממשק נוח וידידותי</p>
                            </div>

                            <div
                                class="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-100">
                                <div class="text-green-600 mb-3">
                                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z">
                                        </path>
                                    </svg>
                                </div>
                                <h3 class="font-semibold text-gray-800 mb-2">ניהול אנשי קשר</h3>
                                <p class="text-sm text-gray-600">זיהוי אנשי קשר והצגת שמות במקום מספרים</p>
                            </div>

                            <div
                                class="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-100">
                                <div class="text-purple-600 mb-3">
                                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z">
                                        </path>
                                    </svg>
                                </div>
                                <h3 class="font-semibold text-gray-800 mb-2">אבטחה</h3>
                                <p class="text-sm text-gray-600">שמירה על חיבור מאובטח לשירותי ימות המשיח</p>
                            </div>
                        </div>
                    </section>

                    <!-- שיתוף מידע -->
                    <section class="bg-red-50 p-6 rounded-xl border-r-4 border-red-400">
                        <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                            <svg class="w-6 h-6 ml-3 text-red-600" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z">
                                </path>
                            </svg>
                            שיתוף מידע
                        </h2>
                        <div class="bg-white p-4 rounded-lg border-2 border-red-200">
                            <p class="text-lg font-semibold text-red-700 mb-2">🔒 אנו לא משתפים את המידע שלך!</p>
                            <p class="text-gray-700">
                                האפליקציה פועלת כממשק ישיר בינך לבין שירותי ימות המשיח בע"מ.
                                כל המידע נשמר אצלם או מקומית בדפדפן שלך בלבד.
                            </p>
                        </div>
                    </section>

                    <!-- אבטחת מידע -->
                    <section>
                        <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                            <svg class="w-6 h-6 ml-3 text-indigo-600" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z">
                                </path>
                            </svg>
                            אבטחת מידע
                        </h2>

                        <div class="grid md:grid-cols-2 gap-6">
                            <div class="space-y-4">
                                <div class="flex items-start space-x-3 space-x-reverse">
                                    <div
                                        class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 class="font-semibold text-gray-800">הצפנת HTTPS</h3>
                                        <p class="text-sm text-gray-600">כל התקשורת מוצפנת עם שירותי ימות המשיח</p>
                                    </div>
                                </div>

                                <div class="flex items-start space-x-3 space-x-reverse">
                                    <div
                                        class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 class="font-semibold text-gray-800">אחסון מקומי</h3>
                                        <p class="text-sm text-gray-600">פרטי התחברות נשמרים בדפדפן בלבד</p>
                                    </div>
                                </div>
                            </div>

                            <div class="space-y-4">
                                <div class="flex items-start space-x-3 space-x-reverse">
                                    <div
                                        class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 class="font-semibold text-gray-800">Google OAuth 2.0</h3>
                                        <p class="text-sm text-gray-600">חיבור מאובטח לאנשי קשר (אופציונלי)</p>
                                    </div>
                                </div>

                                <div class="flex items-start space-x-3 space-x-reverse">
                                    <div
                                        class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 class="font-semibold text-gray-800">ללא שרתים פנימיים</h3>
                                        <p class="text-sm text-gray-600">אין שרתים ביניים - חיבור ישיר בלבד</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- זכויותיך -->
                    <section>
                        <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                            <svg class="w-6 h-6 ml-3 text-yellow-600" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z">
                                </path>
                            </svg>
                            הזכויות שלך
                        </h2>

                        <div
                            class="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                            <div class="grid md:grid-cols-2 gap-6">
                                <div class="space-y-3">
                                    <div class="flex items-center">
                                        <span class="w-3 h-3 bg-yellow-400 rounded-full ml-3"></span>
                                        <span class="font-medium">גישה למידע שלך</span>
                                    </div>
                                    <div class="flex items-center">
                                        <span class="w-3 h-3 bg-yellow-400 rounded-full ml-3"></span>
                                        <span class="font-medium">מחיקת החשבון</span>
                                    </div>
                                    <div class="flex items-center">
                                        <span class="w-3 h-3 bg-yellow-400 rounded-full ml-3"></span>
                                        <span class="font-medium">התנתקות מ-Google</span>
                                    </div>
                                </div>
                                <div class="space-y-3">
                                    <div class="flex items-center">
                                        <span class="w-3 h-3 bg-yellow-400 rounded-full ml-3"></span>
                                        <span class="font-medium">ניקוי נתונים מקומיים</span>
                                    </div>
                                    <div class="flex items-center">
                                        <span class="w-3 h-3 bg-yellow-400 rounded-full ml-3"></span>
                                        <span class="font-medium">בקרה על הרשאות</span>
                                    </div>
                                    <div class="flex items-center">
                                        <span class="w-3 h-3 bg-yellow-400 rounded-full ml-3"></span>
                                        <span class="font-medium">שקיפות מלאה</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- שירותי צד שלישי -->
                    <section>
                        <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                            <svg class="w-6 h-6 ml-3 text-blue-600" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1">
                                </path>
                            </svg>
                            שירותים חיצוניים
                        </h2>

                        <div class="grid md:grid-cols-2 gap-6">
                            <div class="bg-white border-2 border-blue-100 rounded-xl p-6">
                                <div class="flex items-center mb-4">
                                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpath fill='%234285f4' d='M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z'/%3E%3Cpath fill='%2334a853' d='M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z'/%3E%3Cpath fill='%23fbbc05' d='M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z'/%3E%3Cpath fill='%23ea4335' d='M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z'/%3E%3C/svg%3E"
                                        alt="Google" class="w-8 h-8 ml-3">
                                    <h3 class="text-lg font-semibold text-gray-800">Google APIs</h3>
                                </div>
                                <ul class="space-y-2 text-sm text-gray-600">
                                    <li>• Google Contacts API - לסנכרון אנשי קשר</li>
                                    <li>• Google OAuth 2.0 - לאימות מאובטח</li>
                                    <li>• כפוף למדיניות הפרטיות של Google</li>
                                </ul>
                            </div>

                            <div class="bg-white border-2 border-green-100 rounded-xl p-6">
                                <div class="flex items-center mb-4">
                                    <div
                                        class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center ml-3">
                                        <span class="text-white font-bold text-sm">י</span>
                                    </div>
                                    <h3 class="text-lg font-semibold text-gray-800">ימות המשיח בע"מ</h3>
                                </div>
                                <ul class="space-y-2 text-sm text-gray-600">
                                    <li>• API לשליחה וקבלה של SMS</li>
                                    <li>• שמירת הודעות ואנשי קשר</li>
                                    <li>• כפוף למדיניות הפרטיות שלהם</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <!-- יצירת קשר -->
                    <section
                        class="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
                        <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                            <svg class="w-6 h-6 ml-3 text-indigo-600" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z">
                                </path>
                            </svg>
                            יצירת קשר
                        </h2>
                        <p class="text-gray-700 mb-4">לשאלות או בקשות בנוגע למדיניות הפרטיות:</p>
                        <div class="grid md:grid-cols-3 gap-4 text-sm">
                            <div class="flex items-center">
                                <span class="text-indigo-600 ml-2">📧</span>
                                <span>liy@liy.ovh</span>
                            </div>
                            <!-- <div class="flex items-center">
                                <span class="text-indigo-600 ml-2">📱</span>
                                <span></span>
                            </div> -->
                            <div class="flex items-center">
                                <span class="text-indigo-600 ml-2">📍</span>
                                <span>לוד, ישראל</span>
                            </div>
                        </div>
                    </section>

                    <!-- הסכמה -->
                    <section class="text-center bg-gray-50 p-6 rounded-xl">
                        <h2 class="text-xl font-bold text-gray-800 mb-3">הסכמה</h2>
                        <p class="text-gray-600">
                            השימוש באפליקציה מהווה הסכמה למדיניות פרטיות זו.
                            מדיניות זו נכתבה בהתאם לתקנות הגנת הפרטיות הישראליות ואירופאיות (GDPR).
                        </p>
                        <div class="mt-4 text-xs text-gray-500">
                            אפליקציית קוד פתוח - ניתן לבדוק את הקוד בכל עת
                        </div>
                    </section>
                </div>

                <!-- Footer -->
                <div class="bg-gray-50 px-6 py-4 border-t">
                    <div class="flex justify-between items-center">
                        <div class="text-sm text-gray-500">
                            מדיניות פרטיות מעודכנת ליוני 2025
                        </div>
                        <button @click="closePrivacyPolicy"
                            class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium">
                            הבנתי וסגור
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const privacyPolicyVisible = ref(false);

// בדיקה אם אנחנו נמצאים בעמוד מדיניות הפרטיות
const checkPrivacyPolicyPath = () => {
    const currentPath = window.location.pathname;
    return currentPath.endsWith('/privacy-policy') || currentPath.includes('/privacy-policy');
};

// פתיחה/סגירה של מדיניות הפרטיות
const updatePrivacyPolicyVisibility = () => {
    privacyPolicyVisible.value = checkPrivacyPolicyPath();
};

// סגירת מדיניות הפרטיות
const closePrivacyPolicy = () => {
    privacyPolicyVisible.value = false;
    // חזרה לעמוד הראשי
    window.history.pushState({}, document.title, '/');
};

// מאזין לשינויים בנתיב
const handlePopState = () => {
    updatePrivacyPolicyVisibility();
};

// פונקציה גלובלית לפתיחת מדיניות הפרטיות
const openPrivacyPolicy = () => {
    window.history.pushState({}, 'מדיניות פרטיות', '/privacy-policy');
    updatePrivacyPolicyVisibility();
};

onMounted(() => {
    // בדיקה ראשונית
    updatePrivacyPolicyVisibility();

    // הוספת מאזין לשינויים בהיסטוריה
    window.addEventListener('popstate', handlePopState);
    
    // הוספת הפונקציה לחלון הגלובלי כדי שניתן יהיה לקרוא לה מכל מקום
    window.openPrivacyPolicy = openPrivacyPolicy;
});

onUnmounted(() => {
    // הסרת המאזין
    window.removeEventListener('popstate', handlePopState);
    
    // הסרת הפונקציה מהחלון הגלובלי
    delete window.openPrivacyPolicy;
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>