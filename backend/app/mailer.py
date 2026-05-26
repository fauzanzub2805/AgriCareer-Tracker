import os
import smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta
from jose import jwt, JWTError
from dotenv import load_dotenv
from email.utils import make_msgid, formatdate

load_dotenv()

class MailerService:
    def __init__(self):
        self._smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self._smtp_port = int(os.getenv("SMTP_PORT", 587))
        self._smtp_username = os.getenv("SMTP_USERNAME", "")
        self._smtp_password = os.getenv("SMTP_PASSWORD", "")
        self._jwt_secret_key = os.getenv("JWT_SECRET_KEY", "super_secret_jwt_key_agricareer")
        self._jwt_algorithm = "HS256"
        self._frontend_url = os.getenv("FRONTEND_URL", "https://agricareer.site")

    def __create_email_token(self, data: dict, expires_delta: timedelta = timedelta(hours=1)) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + expires_delta
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self._jwt_secret_key, algorithm=self._jwt_algorithm)
        return encoded_jwt

    def verify_email_token(self, token: str) -> dict | None:
        try:
            decoded_token = jwt.decode(token, self._jwt_secret_key, algorithms=[self._jwt_algorithm])
            return decoded_token
        except JWTError:
            return None

    def __send_email(self, to_email: str, subject: str, html_body: str, plain_text_body: str = ""):
        if not self._smtp_username or not self._smtp_password:
            print(f"Skipping email to {to_email} because SMTP credentials are not set.")
            return

        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = f"AgriCareer Tracker <{self._smtp_username}>"
        msg["To"] = to_email
        msg["Reply-To"] = self._smtp_username
        msg["Date"] = formatdate(localtime=True)
        msg["Message-ID"] = make_msgid(domain=self._smtp_username.split('@')[-1] if '@' in self._smtp_username else 'agricareer.site')
        
        if plain_text_body:
            msg.set_content(plain_text_body)
        else:
            msg.set_content("Harap gunakan klien email yang mendukung HTML untuk melihat pesan ini.")

        msg.add_alternative(html_body, subtype='html')

        try:
            with smtplib.SMTP(self._smtp_server, self._smtp_port) as server:
                server.starttls()
                server.login(self._smtp_username, self._smtp_password)
                server.sendmail(self._smtp_username, to_email, msg.as_string())
        except Exception as e:
            print(f"Failed to send email to {to_email}: {str(e)}")

    def send_verification_email(self, to_email: str, username: str, full_name: str):
        token = self.__create_email_token({"sub": username, "type": "verify"}, timedelta(hours=24))
        verify_link = f"{self._frontend_url}/verify-email?token={token}"
        
        subject = "Verifikasi Email - AgriCareer Tracker"
        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Halo, {full_name}!</h2>
            <p>Terima kasih telah mendaftar di AgriCareer Tracker.</p>
            <p>Silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda:</p>
            <p>
              <a href="{verify_link}" style="display: inline-block; padding: 10px 20px; background-color: #facc15; color: #1e2638; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Verifikasi Email
              </a>
            </p>
            <p>Atau copy link berikut ke browser Anda:<br>
            <a href="{verify_link}">{verify_link}</a>
            </p>
            <p>Link ini akan kedaluwarsa dalam 24 jam.</p>
            <br>
            <p>Salam,<br>Tim AgriCareer Tracker</p>
          </body>
        </html>
        """
        plain_text_body = f"""
Halo, {full_name}!

Terima kasih telah mendaftar di AgriCareer Tracker.
Silakan kunjungi link berikut untuk memverifikasi alamat email Anda:
{verify_link}

Link ini akan kedaluwarsa dalam 24 jam.

Salam,
Tim AgriCareer Tracker
"""
        self.__send_email(to_email, subject, html_body, plain_text_body)

    def send_reset_password_email(self, to_email: str, username: str, full_name: str):
        token = self.__create_email_token({"sub": username, "type": "reset"}, timedelta(hours=1))
        reset_link = f"{self._frontend_url}/reset-password?token={token}"
        
        subject = "Reset Password - AgriCareer Tracker"
        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Halo, {full_name}!</h2>
            <p>Kami menerima permintaan untuk mereset password akun AgriCareer Tracker Anda.</p>
            <p>Silakan klik tombol di bawah ini untuk membuat password baru:</p>
            <p>
              <a href="{reset_link}" style="display: inline-block; padding: 10px 20px; background-color: #4D44B5; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Reset Password
              </a>
            </p>
            <p>Atau copy link berikut ke browser Anda:<br>
            <a href="{reset_link}">{reset_link}</a>
            </p>
            <p>Link ini akan kedaluwarsa dalam 1 jam.</p>
            <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
            <br>
            <p>Salam,<br>Tim AgriCareer Tracker</p>
          </body>
        </html>
        """
        plain_text_body = f"""
Halo, {full_name}!

Kami menerima permintaan untuk mereset password akun AgriCareer Tracker Anda.
Silakan kunjungi link berikut untuk membuat password baru:
{reset_link}

Link ini akan kedaluwarsa dalam 1 jam. Jika Anda tidak meminta reset password, abaikan email ini.

Salam,
Tim AgriCareer Tracker
"""
        self.__send_email(to_email, subject, html_body, plain_text_body)

mailer_service = MailerService()
