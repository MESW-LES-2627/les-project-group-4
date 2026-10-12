CREATE TABLE room (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    width_cm INT NOT NULL,
    length_cm INT NOT NULL
);

CREATE TABLE item (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    width_cm INT,
    depth_cm INT,
    price_eur NUMERIC(10,2)
);
