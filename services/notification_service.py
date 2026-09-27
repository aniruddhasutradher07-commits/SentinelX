"""
Notification Service — Multi-Provider Alert Dispatch Abstraction
================================================================
Truthful emergency broadcast dispatcher supporting SMS & WhatsApp.
Enforces strict operational safety:
  - dry_run=True returns DEMO ACTION (never sends to carrier networks)
  - Missing API keys return CREDENTIALS_NOT_CONFIGURED
  - Configured providers execute actual API requests
  - Never fabricates delivery receipts or carrier confirmations
"""

import os
import time
import uuid
import datetime
from typing import Dict, Any, List, Optional
import requests

class NotificationService:
    def __init__(self):
        # SMS provider credentials
        self.sms_provider = os.environ.get("SMS_PROVIDER", "").upper()  # e.g., "TWILIO", "NIC"
        self.sms_api_key = os.environ.get("SMS_API_KEY", "")
        self.sms_sender_id = os.environ.get("SMS_SENDER_ID", "")
        
        # Twilio credentials (if Twilio is used for SMS / WhatsApp)
        self.twilio_account_sid = os.environ.get("TWILIO_ACCOUNT_SID", "")
        self.twilio_auth_token = os.environ.get("TWILIO_AUTH_TOKEN", "")
        self.twilio_phone_number = os.environ.get("TWILIO_PHONE_NUMBER", "")
        
        # WhatsApp provider credentials
        self.whatsapp_provider = os.environ.get("WHATSAPP_PROVIDER", "").upper() # e.g., "TWILIO", "META"
        self.whatsapp_api_key = os.environ.get("WHATSAPP_API_KEY", "")
        self.whatsapp_phone_number_id = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "")

        # In-memory rate limiting: {ip_or_region: [timestamp, ...]}
        self._rate_limits: Dict[str, List[float]] = {}
        self.max_per_minute = 10

        # In-memory audit log (capped at 100 entries)
        self._audit_log: List[Dict[str, Any]] = []

    def _is_rate_limited(self, key: str) -> bool:
        now = time.time()
        window = 60.0  # 1 minute
        timestamps = self._rate_limits.get(key, [])
        valid_timestamps = [t for t in timestamps if now - t < window]
        self._rate_limits[key] = valid_timestamps
        if len(valid_timestamps) >= self.max_per_minute:
            return True
        self._rate_limits[key].append(now)
        return False

    def dispatch(
        self,
        region: str,
        channel: str = "SMS",
        alert_tier: str = "RED",
        message: str = "",
        dry_run: bool = True,
        recipient: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Dispatches notification or simulates dispatch when dry_run=True.
        """
        ch = channel.upper()
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
        audit_id = f"ALERT-{uuid.uuid4().hex[:8].upper()}"

        # 1. Rate limiting check
        rate_key = f"{region}_{ch}"
        if self._is_rate_limited(rate_key):
            record = {
                "audit_id": audit_id,
                "status": "RATE_LIMITED",
                "delivery_status": "RATE_LIMITED",
                "message": "Maximum alert dispatches exceeded for this region (10/min).",
                "timestamp": now_iso,
                "region": region,
                "channel": ch,
                "alert_tier": alert_tier,
                "dry_run": dry_run
            }
            self._log_audit(record)
            return record

        # 2. DRY-RUN MODE: Safe demonstration
        if dry_run:
            record = {
                "audit_id": audit_id,
                "status": "DEMO ACTION",
                "delivery_status": "DEMO ACTION",
                "provenance": "Simulation mode — no carrier network dispatch executed",
                "region": region,
                "channel": ch,
                "alert_tier": alert_tier,
                "message_payload": message or f"🚨 [HeatGuard AI {alert_tier} Alert] Extreme thermal conditions detected in {region}.",
                "recipient": recipient or "+91-XXXXXXXXXX (Demo)",
                "timestamp": now_iso,
                "dry_run": True,
                "provider": "DEMO_SIMULATOR"
            }
            self._log_audit(record)
            return record

        # 3. REAL DISPATCH: Validate credentials
        if ch == "SMS":
            has_creds = bool((self.sms_api_key and self.sms_provider) or (self.twilio_account_sid and self.twilio_auth_token and self.twilio_phone_number))
            if not has_creds:
                record = {
                    "audit_id": audit_id,
                    "status": "CREDENTIALS_NOT_CONFIGURED",
                    "delivery_status": "CREDENTIALS_NOT_CONFIGURED",
                    "reason": "SMS gateway credentials (SMS_API_KEY or TWILIO_ACCOUNT_SID) are not configured in environment.",
                    "region": region,
                    "channel": ch,
                    "alert_tier": alert_tier,
                    "timestamp": now_iso,
                    "dry_run": False
                }
                self._log_audit(record)
                return record

            # Attempt actual carrier dispatch if Twilio is configured
            if self.twilio_account_sid and self.twilio_auth_token and self.twilio_phone_number:
                try:
                    target_phone = recipient or os.environ.get("EMERGENCY_RECIPIENT_PHONE")
                    if not target_phone:
                        raise ValueError("Recipient phone number required for live carrier dispatch.")
                    
                    url = f"https://api.twilio.com/2010-04-01/Accounts/{self.twilio_account_sid}/Messages.json"
                    payload = {
                        "From": self.twilio_phone_number,
                        "To": target_phone,
                        "Body": message
                    }
                    resp = requests.post(
                        url,
                        data=payload,
                        auth=(self.twilio_account_sid, self.twilio_auth_token),
                        timeout=10
                    )
                    resp_json = resp.json()
                    if resp.status_code in (200, 201):
                        record = {
                            "audit_id": audit_id,
                            "status": "SENT",
                            "delivery_status": "SENT",
                            "provider_message_id": resp_json.get("sid"),
                            "region": region,
                            "channel": ch,
                            "alert_tier": alert_tier,
                            "timestamp": now_iso,
                            "dry_run": False,
                            "provider": "Twilio SMS"
                        }
                    else:
                        record = {
                            "audit_id": audit_id,
                            "status": "FAILED",
                            "delivery_status": "FAILED",
                            "reason": resp_json.get("message", "Upstream SMS gateway error"),
                            "region": region,
                            "channel": ch,
                            "alert_tier": alert_tier,
                            "timestamp": now_iso,
                            "dry_run": False
                        }
                    self._log_audit(record)
                    return record
                except Exception as ex:
                    record = {
                        "audit_id": audit_id,
                        "status": "FAILED",
                        "delivery_status": "FAILED",
                        "reason": str(ex),
                        "region": region,
                        "channel": ch,
                        "alert_tier": alert_tier,
                        "timestamp": now_iso,
                        "dry_run": False
                    }
                    self._log_audit(record)
                    return record

        elif ch == "WHATSAPP":
            has_creds = bool((self.whatsapp_api_key and self.whatsapp_provider) or (self.twilio_account_sid and self.twilio_auth_token))
            if not has_creds:
                record = {
                    "audit_id": audit_id,
                    "status": "CREDENTIALS_NOT_CONFIGURED",
                    "delivery_status": "CREDENTIALS_NOT_CONFIGURED",
                    "reason": "WhatsApp provider credentials (WHATSAPP_API_KEY or TWILIO credentials) are not configured in environment.",
                    "region": region,
                    "channel": ch,
                    "alert_tier": alert_tier,
                    "timestamp": now_iso,
                    "dry_run": False
                }
                self._log_audit(record)
                return record

            # Attempt actual WhatsApp dispatch if Twilio is configured
            if self.twilio_account_sid and self.twilio_auth_token:
                try:
                    target_phone = recipient or os.environ.get("EMERGENCY_RECIPIENT_PHONE")
                    if not target_phone:
                        raise ValueError("Recipient phone number required for live WhatsApp dispatch.")
                    
                    url = f"https://api.twilio.com/2010-04-01/Accounts/{self.twilio_account_sid}/Messages.json"
                    payload = {
                        "From": f"whatsapp:{self.twilio_phone_number}",
                        "To": f"whatsapp:{target_phone}",
                        "Body": message
                    }
                    resp = requests.post(
                        url,
                        data=payload,
                        auth=(self.twilio_account_sid, self.twilio_auth_token),
                        timeout=10
                    )
                    resp_json = resp.json()
                    if resp.status_code in (200, 201):
                        record = {
                            "audit_id": audit_id,
                            "status": "SENT",
                            "delivery_status": "SENT",
                            "provider_message_id": resp_json.get("sid"),
                            "region": region,
                            "channel": ch,
                            "alert_tier": alert_tier,
                            "timestamp": now_iso,
                            "dry_run": False,
                            "provider": "Twilio WhatsApp"
                        }
                    else:
                        record = {
                            "audit_id": audit_id,
                            "status": "FAILED",
                            "delivery_status": "FAILED",
                            "reason": resp_json.get("message", "Upstream WhatsApp gateway error"),
                            "region": region,
                            "channel": ch,
                            "alert_tier": alert_tier,
                            "timestamp": now_iso,
                            "dry_run": False
                        }
                    self._log_audit(record)
                    return record
                except Exception as ex:
                    record = {
                        "audit_id": audit_id,
                        "status": "FAILED",
                        "delivery_status": "FAILED",
                        "reason": str(ex),
                        "region": region,
                        "channel": ch,
                        "alert_tier": alert_tier,
                        "timestamp": now_iso,
                        "dry_run": False
                    }
                    self._log_audit(record)
                    return record

        return {
            "audit_id": audit_id,
            "status": "FAILED",
            "delivery_status": "FAILED",
            "reason": f"Unsupported notification channel: {ch}",
            "timestamp": now_iso
        }

    def _log_audit(self, record: Dict[str, Any]):
        self._audit_log.insert(0, record)
        if len(self._audit_log) > 100:
            self._audit_log.pop()

    def get_audit_logs(self, limit: int = 20) -> List[Dict[str, Any]]:
        return self._audit_log[:limit]

notification_service = NotificationService()
