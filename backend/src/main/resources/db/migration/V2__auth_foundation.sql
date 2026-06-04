ALTER TABLE users
    MODIFY email VARCHAR(255) NOT NULL,
    MODIFY password_hash VARCHAR(255) NOT NULL,
    MODIFY username VARCHAR(50) NOT NULL,
    MODIFY display_name VARCHAR(100) NOT NULL,
    MODIFY role VARCHAR(30) NOT NULL,
    MODIFY status VARCHAR(30) NOT NULL,
    MODIFY email_verified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
    ADD COLUMN last_login_at TIMESTAMP NULL AFTER email_verified;

CREATE TABLE email_verification_tokens (
                                           id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                           user_id BIGINT NOT NULL,
                                           token_hash VARCHAR(255) NOT NULL,
                                           expires_at TIMESTAMP NOT NULL,
                                           used_at TIMESTAMP NULL,
                                           created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                           CONSTRAINT fk_email_verification_tokens_user
                                               FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_email_verification_tokens_user_id
    ON email_verification_tokens(user_id);

CREATE INDEX idx_email_verification_tokens_expires_at
    ON email_verification_tokens(expires_at);