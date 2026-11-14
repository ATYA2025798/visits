-- دعم النظام: حساب مخفي بكل الصلاحيات
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPPORT';
