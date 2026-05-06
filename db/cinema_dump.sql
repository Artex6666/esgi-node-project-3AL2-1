--
-- PostgreSQL database dump
--

\restrict uSCkqovur3m5faSrXR9DDtPGj1KjPBQRPqxX0e8E8D8hTlbSqYAM7Nf3eTAd95N

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_ticketId_fkey";
ALTER TABLE IF EXISTS ONLY public."Ticket" DROP CONSTRAINT IF EXISTS "Ticket_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."TicketUsage" DROP CONSTRAINT IF EXISTS "TicketUsage_ticketId_fkey";
ALTER TABLE IF EXISTS ONLY public."TicketUsage" DROP CONSTRAINT IF EXISTS "TicketUsage_sessionId_fkey";
ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_roomId_fkey";
ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_movieId_fkey";
ALTER TABLE IF EXISTS ONLY public."RefreshToken" DROP CONSTRAINT IF EXISTS "RefreshToken_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."EmployeeShift" DROP CONSTRAINT IF EXISTS "EmployeeShift_userId_fkey";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."Transaction_userId_createdAt_idx";
DROP INDEX IF EXISTS public."Transaction_ticketId_key";
DROP INDEX IF EXISTS public."Ticket_userId_idx";
DROP INDEX IF EXISTS public."TicketUsage_ticketId_sessionId_key";
DROP INDEX IF EXISTS public."TicketUsage_sessionId_idx";
DROP INDEX IF EXISTS public."Session_roomId_startsAt_idx";
DROP INDEX IF EXISTS public."Session_movieId_startsAt_idx";
DROP INDEX IF EXISTS public."Room_name_key";
DROP INDEX IF EXISTS public."RefreshToken_userId_idx";
DROP INDEX IF EXISTS public."RefreshToken_tokenHash_key";
DROP INDEX IF EXISTS public."EmployeeShift_userId_idx";
DROP INDEX IF EXISTS public."EmployeeShift_startsAt_idx";
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_pkey";
ALTER TABLE IF EXISTS ONLY public."Ticket" DROP CONSTRAINT IF EXISTS "Ticket_pkey";
ALTER TABLE IF EXISTS ONLY public."TicketUsage" DROP CONSTRAINT IF EXISTS "TicketUsage_pkey";
ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_pkey";
ALTER TABLE IF EXISTS ONLY public."Room" DROP CONSTRAINT IF EXISTS "Room_pkey";
ALTER TABLE IF EXISTS ONLY public."RefreshToken" DROP CONSTRAINT IF EXISTS "RefreshToken_pkey";
ALTER TABLE IF EXISTS ONLY public."Movie" DROP CONSTRAINT IF EXISTS "Movie_pkey";
ALTER TABLE IF EXISTS ONLY public."EmployeeShift" DROP CONSTRAINT IF EXISTS "EmployeeShift_pkey";
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."Transaction";
DROP TABLE IF EXISTS public."TicketUsage";
DROP TABLE IF EXISTS public."Ticket";
DROP TABLE IF EXISTS public."Session";
DROP TABLE IF EXISTS public."Room";
DROP TABLE IF EXISTS public."RefreshToken";
DROP TABLE IF EXISTS public."Movie";
DROP TABLE IF EXISTS public."EmployeeShift";
DROP TYPE IF EXISTS public."UserRole";
DROP TYPE IF EXISTS public."TransactionKind";
DROP TYPE IF EXISTS public."TicketKind";
DROP TYPE IF EXISTS public."EmployeePosition";
--
-- Name: EmployeePosition; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EmployeePosition" AS ENUM (
    'CONCESSION',
    'RECEPTION',
    'PROJECTIONIST'
);


--
-- Name: TicketKind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TicketKind" AS ENUM (
    'STANDARD',
    'SUPER'
);


--
-- Name: TransactionKind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TransactionKind" AS ENUM (
    'DEPOSIT',
    'WITHDRAWAL',
    'TICKET_PURCHASE'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'CLIENT',
    'ADMIN',
    'SUPER_ADMIN'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: EmployeeShift; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EmployeeShift" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "position" public."EmployeePosition" NOT NULL,
    "startsAt" timestamp(3) without time zone NOT NULL,
    "endsAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Movie; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Movie" (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "durationMin" integer NOT NULL,
    genre text NOT NULL,
    "releasedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: RefreshToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RefreshToken" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "tokenHash" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Room; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Room" (
    id text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    images text[],
    type text NOT NULL,
    capacity integer NOT NULL,
    accessible boolean DEFAULT false NOT NULL,
    "underMaintenance" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "movieId" text NOT NULL,
    "roomId" text NOT NULL,
    "startsAt" timestamp(3) without time zone NOT NULL,
    "endsAt" timestamp(3) without time zone NOT NULL,
    "priceCents" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Ticket; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Ticket" (
    id text NOT NULL,
    "userId" text NOT NULL,
    kind public."TicketKind" NOT NULL,
    "usesRemaining" integer NOT NULL,
    "purchasedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TicketUsage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TicketUsage" (
    id text NOT NULL,
    "ticketId" text NOT NULL,
    "sessionId" text NOT NULL,
    "usedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Transaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Transaction" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "amountCents" integer NOT NULL,
    kind public."TransactionKind" NOT NULL,
    "ticketId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    role public."UserRole" DEFAULT 'CLIENT'::public."UserRole" NOT NULL,
    "balanceCents" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Data for Name: EmployeeShift; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EmployeeShift" (id, "userId", "position", "startsAt", "endsAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Movie; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Movie" (id, title, description, "durationMin", genre, "releasedAt", "createdAt") FROM stdin;
cmou5w4lf000epn26202t76cv	Inception	Un voleur s'introduit dans les rêves.	148	Science-fiction	2010-07-21 00:00:00	2026-05-06 14:37:48.483
cmou5w4lf000fpn26z98kvkrb	The Dark Knight	Batman affronte le Joker à Gotham.	152	Action	2008-08-13 00:00:00	2026-05-06 14:37:48.483
cmou5w4lf000gpn26koc8bm9i	Interstellar	Voyage interstellaire pour sauver l'humanité.	169	Science-fiction	2014-11-05 00:00:00	2026-05-06 14:37:48.483
cmou5w4lf000hpn26mt4c5kq5	Le Voyage de Chihiro	Une fillette dans un monde d'esprits.	125	Animation	2002-04-10 00:00:00	2026-05-06 14:37:48.483
cmou5w4lf000ipn267ir0jm76	Parasite	Une famille pauvre s'infiltre chez des riches.	132	Thriller	2019-06-05 00:00:00	2026-05-06 14:37:48.483
cmou5w4lf000jpn26bw2aqhov	Amélie	Une jeune femme bouleverse la vie autour d'elle.	122	Comédie	2001-04-25 00:00:00	2026-05-06 14:37:48.483
cmou5w4lf000kpn26ybvypynb	Dune: Part Two	Suite de l'épopée sur Arrakis.	166	Science-fiction	2024-02-28 00:00:00	2026-05-06 14:37:48.483
cmou5w4lf000lpn268ihmlfz4	Oppenheimer	Le père de la bombe atomique.	180	Biographie	2023-07-19 00:00:00	2026-05-06 14:37:48.483
cmou5w4lf000mpn26nw0qq6ho	Past Lives	Deux amis d'enfance se retrouvent 20 ans plus tard.	105	Drame	2023-09-13 00:00:00	2026-05-06 14:37:48.483
cmou5w4lf000npn26juwakpsm	The Substance	Une star vieillissante teste un produit étrange.	141	Horreur	2024-11-06 00:00:00	2026-05-06 14:37:48.483
\.


--
-- Data for Name: RefreshToken; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RefreshToken" (id, "userId", "tokenHash", "expiresAt", "revokedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Room; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Room" (id, name, description, images, type, capacity, accessible, "underMaintenance", "createdAt") FROM stdin;
cmou5w4la0004pn26m4katt8k	Salle 1	Petite salle 2D avec sièges classiques	{}	2D	18	t	f	2026-05-06 14:37:48.479
cmou5w4la0005pn26k6n8zhk6	Salle 2	Salle 2D Dolby Atmos	{}	2D	24	t	f	2026-05-06 14:37:48.479
cmou5w4la0006pn26erjqedag	Salle 3	Salle 3D nouvelle génération	{}	3D	28	t	f	2026-05-06 14:37:48.479
cmou5w4la0007pn26oioijdlg	Salle 4	Salle 3D avec lunettes fournies	{}	3D	22	f	f	2026-05-06 14:37:48.479
cmou5w4la0008pn26yl2p876a	Salle 5	Salle IMAX immersive	{}	IMAX	30	t	f	2026-05-06 14:37:48.479
cmou5w4la0009pn26u5jmnsye	Salle 6	Salle VIP avec fauteuils inclinables	{}	VIP	16	t	f	2026-05-06 14:37:48.479
cmou5w4la000apn26n7fva0rt	Salle 7	Salle 4DX avec effets sensoriels	{}	4DX	20	f	f	2026-05-06 14:37:48.479
cmou5w4la000bpn26z52o7s9i	Salle 8	Salle 2D standard	{}	2D	26	t	f	2026-05-06 14:37:48.479
cmou5w4la000cpn266ocjvjuc	Salle 9	Salle 2D petite capacité	{}	2D	15	t	t	2026-05-06 14:37:48.479
cmou5w4la000dpn26k9jcb1jx	Salle 10	Salle 3D premium	{}	3D	25	t	f	2026-05-06 14:37:48.479
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Session" (id, "movieId", "roomId", "startsAt", "endsAt", "priceCents", "createdAt") FROM stdin;
cmou5w4ln000opn26z7qrma8t	cmou5w4lf000epn26202t76cv	cmou5w4la0004pn26m4katt8k	2026-05-06 10:00:00	2026-05-06 12:58:00	1000	2026-05-06 14:37:48.491
cmou5w4ln000ppn26sevbmcqu	cmou5w4lf000fpn26z98kvkrb	cmou5w4la0005pn26k6n8zhk6	2026-05-06 13:00:00	2026-05-06 16:02:00	1000	2026-05-06 14:37:48.491
cmou5w4ln000qpn264xzj5f8n	cmou5w4lf000gpn26koc8bm9i	cmou5w4la0006pn26erjqedag	2026-05-06 16:00:00	2026-05-06 19:19:00	1000	2026-05-06 14:37:48.491
cmou5w4ln000rpn26s9atap5p	cmou5w4lf000ipn267ir0jm76	cmou5w4la0008pn26yl2p876a	2026-05-07 10:00:00	2026-05-07 12:42:00	1000	2026-05-06 14:37:48.491
cmou5w4ln000spn26kjyrc8uz	cmou5w4lf000jpn26bw2aqhov	cmou5w4la0009pn26u5jmnsye	2026-05-07 13:00:00	2026-05-07 15:32:00	1000	2026-05-06 14:37:48.491
cmou5w4ln000tpn26daw6lb31	cmou5w4lf000kpn26ybvypynb	cmou5w4la000apn26n7fva0rt	2026-05-07 16:00:00	2026-05-07 19:16:00	1000	2026-05-06 14:37:48.491
cmou5w4ln000upn261fl1rhur	cmou5w4lf000mpn26nw0qq6ho	cmou5w4la000dpn26k9jcb1jx	2026-05-08 10:00:00	2026-05-08 12:15:00	1000	2026-05-06 14:37:48.491
cmou5w4ln000vpn26kg8vl4o3	cmou5w4lf000npn26juwakpsm	cmou5w4la0004pn26m4katt8k	2026-05-08 13:00:00	2026-05-08 15:51:00	1000	2026-05-06 14:37:48.491
cmou5w4ln000wpn26ri1nw29r	cmou5w4lf000epn26202t76cv	cmou5w4la0005pn26k6n8zhk6	2026-05-08 16:00:00	2026-05-08 18:58:00	1000	2026-05-06 14:37:48.491
cmou5w4ln000xpn269enmsx1h	cmou5w4lf000gpn26koc8bm9i	cmou5w4la0007pn26oioijdlg	2026-05-11 10:00:00	2026-05-11 13:19:00	1000	2026-05-06 14:37:48.491
cmou5w4ln000ypn2668uidon2	cmou5w4lf000hpn26mt4c5kq5	cmou5w4la0008pn26yl2p876a	2026-05-11 13:00:00	2026-05-11 15:35:00	1000	2026-05-06 14:37:48.491
cmou5w4ln000zpn262zv53bz6	cmou5w4lf000ipn267ir0jm76	cmou5w4la0009pn26u5jmnsye	2026-05-11 16:00:00	2026-05-11 18:42:00	1000	2026-05-06 14:37:48.491
cmou5w4ln0010pn264pi5h22l	cmou5w4lf000kpn26ybvypynb	cmou5w4la000bpn26z52o7s9i	2026-05-12 10:00:00	2026-05-12 13:16:00	1000	2026-05-06 14:37:48.491
cmou5w4ln0011pn26e0ag3mau	cmou5w4lf000lpn268ihmlfz4	cmou5w4la000dpn26k9jcb1jx	2026-05-12 13:00:00	2026-05-12 16:30:00	1000	2026-05-06 14:37:48.491
cmou5w4ln0012pn266h0auikb	cmou5w4lf000mpn26nw0qq6ho	cmou5w4la0004pn26m4katt8k	2026-05-12 16:00:00	2026-05-12 18:15:00	1000	2026-05-06 14:37:48.491
cmou5w4ln0013pn2633pee93v	cmou5w4lf000epn26202t76cv	cmou5w4la0006pn26erjqedag	2026-05-13 10:00:00	2026-05-13 12:58:00	1000	2026-05-06 14:37:48.491
cmou5w4ln0014pn26xrwlggew	cmou5w4lf000fpn26z98kvkrb	cmou5w4la0007pn26oioijdlg	2026-05-13 13:00:00	2026-05-13 16:02:00	1000	2026-05-06 14:37:48.491
cmou5w4ln0015pn26jvt3gurg	cmou5w4lf000gpn26koc8bm9i	cmou5w4la0008pn26yl2p876a	2026-05-13 16:00:00	2026-05-13 19:19:00	1000	2026-05-06 14:37:48.491
cmou5w4ln0016pn26u5uwou80	cmou5w4lf000ipn267ir0jm76	cmou5w4la000apn26n7fva0rt	2026-05-14 10:00:00	2026-05-14 12:42:00	1000	2026-05-06 14:37:48.491
cmou5w4ln0017pn26oieytgbc	cmou5w4lf000jpn26bw2aqhov	cmou5w4la000bpn26z52o7s9i	2026-05-14 13:00:00	2026-05-14 15:32:00	1000	2026-05-06 14:37:48.491
cmou5w4ln0018pn26za5qaxtg	cmou5w4lf000kpn26ybvypynb	cmou5w4la000dpn26k9jcb1jx	2026-05-14 16:00:00	2026-05-14 19:16:00	1000	2026-05-06 14:37:48.491
cmou5w4ln0019pn26z64s8u6w	cmou5w4lf000mpn26nw0qq6ho	cmou5w4la0005pn26k6n8zhk6	2026-05-15 10:00:00	2026-05-15 12:15:00	1000	2026-05-06 14:37:48.491
cmou5w4ln001apn26xlszoies	cmou5w4lf000npn26juwakpsm	cmou5w4la0006pn26erjqedag	2026-05-15 13:00:00	2026-05-15 15:51:00	1000	2026-05-06 14:37:48.491
cmou5w4ln001bpn263d9h52du	cmou5w4lf000epn26202t76cv	cmou5w4la0007pn26oioijdlg	2026-05-15 16:00:00	2026-05-15 18:58:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001cpn26peliib76	cmou5w4lf000gpn26koc8bm9i	cmou5w4la0009pn26u5jmnsye	2026-05-18 10:00:00	2026-05-18 13:19:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001dpn26q8ghz89v	cmou5w4lf000hpn26mt4c5kq5	cmou5w4la000apn26n7fva0rt	2026-05-18 13:00:00	2026-05-18 15:35:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001epn26xu0h5jj0	cmou5w4lf000ipn267ir0jm76	cmou5w4la000bpn26z52o7s9i	2026-05-18 16:00:00	2026-05-18 18:42:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001fpn26hip8zqf6	cmou5w4lf000kpn26ybvypynb	cmou5w4la0004pn26m4katt8k	2026-05-19 10:00:00	2026-05-19 13:16:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001gpn26q60aobue	cmou5w4lf000lpn268ihmlfz4	cmou5w4la0005pn26k6n8zhk6	2026-05-19 13:00:00	2026-05-19 16:30:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001hpn267dv0ef23	cmou5w4lf000mpn26nw0qq6ho	cmou5w4la0006pn26erjqedag	2026-05-19 16:00:00	2026-05-19 18:15:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001ipn26s69eq3dd	cmou5w4lf000epn26202t76cv	cmou5w4la0008pn26yl2p876a	2026-05-20 10:00:00	2026-05-20 12:58:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001jpn26irsllqx5	cmou5w4lf000fpn26z98kvkrb	cmou5w4la0009pn26u5jmnsye	2026-05-20 13:00:00	2026-05-20 16:02:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001kpn264w589pf7	cmou5w4lf000gpn26koc8bm9i	cmou5w4la000apn26n7fva0rt	2026-05-20 16:00:00	2026-05-20 19:19:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001lpn264476yl7g	cmou5w4lf000ipn267ir0jm76	cmou5w4la000dpn26k9jcb1jx	2026-05-21 10:00:00	2026-05-21 12:42:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001mpn26rp685rh3	cmou5w4lf000jpn26bw2aqhov	cmou5w4la0004pn26m4katt8k	2026-05-21 13:00:00	2026-05-21 15:32:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001npn268woi6k5r	cmou5w4lf000kpn26ybvypynb	cmou5w4la0005pn26k6n8zhk6	2026-05-21 16:00:00	2026-05-21 19:16:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001opn26hqh4m7os	cmou5w4lf000mpn26nw0qq6ho	cmou5w4la0007pn26oioijdlg	2026-05-22 10:00:00	2026-05-22 12:15:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001ppn26hh0907y9	cmou5w4lf000npn26juwakpsm	cmou5w4la0008pn26yl2p876a	2026-05-22 13:00:00	2026-05-22 15:51:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001qpn26jxljuvgu	cmou5w4lf000epn26202t76cv	cmou5w4la0009pn26u5jmnsye	2026-05-22 16:00:00	2026-05-22 18:58:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001rpn26nfwiande	cmou5w4lf000gpn26koc8bm9i	cmou5w4la000bpn26z52o7s9i	2026-05-25 10:00:00	2026-05-25 13:19:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001spn26p95a7ow5	cmou5w4lf000hpn26mt4c5kq5	cmou5w4la000dpn26k9jcb1jx	2026-05-25 13:00:00	2026-05-25 15:35:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001tpn26pyxkftfh	cmou5w4lf000ipn267ir0jm76	cmou5w4la0004pn26m4katt8k	2026-05-25 16:00:00	2026-05-25 18:42:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001upn26sin77ofj	cmou5w4lf000kpn26ybvypynb	cmou5w4la0006pn26erjqedag	2026-05-26 10:00:00	2026-05-26 13:16:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001vpn26yzjw9kbv	cmou5w4lf000lpn268ihmlfz4	cmou5w4la0007pn26oioijdlg	2026-05-26 13:00:00	2026-05-26 16:30:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001wpn26lq28rhvd	cmou5w4lf000mpn26nw0qq6ho	cmou5w4la0008pn26yl2p876a	2026-05-26 16:00:00	2026-05-26 18:15:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001xpn267ct1vpdb	cmou5w4lf000epn26202t76cv	cmou5w4la000apn26n7fva0rt	2026-05-27 10:00:00	2026-05-27 12:58:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001ypn26di14wow8	cmou5w4lf000fpn26z98kvkrb	cmou5w4la000bpn26z52o7s9i	2026-05-27 13:00:00	2026-05-27 16:02:00	1000	2026-05-06 14:37:48.491
cmou5w4lo001zpn26356nli1t	cmou5w4lf000gpn26koc8bm9i	cmou5w4la000dpn26k9jcb1jx	2026-05-27 16:00:00	2026-05-27 19:19:00	1000	2026-05-06 14:37:48.491
cmou5w4lo0020pn26aui5vhcp	cmou5w4lf000ipn267ir0jm76	cmou5w4la0005pn26k6n8zhk6	2026-05-28 10:00:00	2026-05-28 12:42:00	1000	2026-05-06 14:37:48.491
cmou5w4lo0021pn26hxex0g0q	cmou5w4lf000jpn26bw2aqhov	cmou5w4la0006pn26erjqedag	2026-05-28 13:00:00	2026-05-28 15:32:00	1000	2026-05-06 14:37:48.491
cmou5w4lo0022pn26za4de2tu	cmou5w4lf000kpn26ybvypynb	cmou5w4la0007pn26oioijdlg	2026-05-28 16:00:00	2026-05-28 19:16:00	1000	2026-05-06 14:37:48.491
cmou5w4lo0023pn2654v7j34u	cmou5w4lf000mpn26nw0qq6ho	cmou5w4la0009pn26u5jmnsye	2026-05-29 10:00:00	2026-05-29 12:15:00	1000	2026-05-06 14:37:48.491
cmou5w4lo0024pn26b6i6j4xz	cmou5w4lf000npn26juwakpsm	cmou5w4la000apn26n7fva0rt	2026-05-29 13:00:00	2026-05-29 15:51:00	1000	2026-05-06 14:37:48.491
cmou5w4lo0025pn26okluqj8j	cmou5w4lf000epn26202t76cv	cmou5w4la000bpn26z52o7s9i	2026-05-29 16:00:00	2026-05-29 18:58:00	1000	2026-05-06 14:37:48.491
cmou5w4lo0026pn26mgs7jq2s	cmou5w4lf000gpn26koc8bm9i	cmou5w4la0004pn26m4katt8k	2026-06-01 10:00:00	2026-06-01 13:19:00	1000	2026-05-06 14:37:48.491
cmou5w4lo0027pn26mb3hqbxz	cmou5w4lf000hpn26mt4c5kq5	cmou5w4la0005pn26k6n8zhk6	2026-06-01 13:00:00	2026-06-01 15:35:00	1000	2026-05-06 14:37:48.491
cmou5w4lo0028pn26qojlnd4n	cmou5w4lf000ipn267ir0jm76	cmou5w4la0006pn26erjqedag	2026-06-01 16:00:00	2026-06-01 18:42:00	1000	2026-05-06 14:37:48.491
cmou5w4lo0029pn26ztvv0r10	cmou5w4lf000kpn26ybvypynb	cmou5w4la0008pn26yl2p876a	2026-06-02 10:00:00	2026-06-02 13:16:00	1000	2026-05-06 14:37:48.491
cmou5w4lo002apn269c3km5j2	cmou5w4lf000lpn268ihmlfz4	cmou5w4la0009pn26u5jmnsye	2026-06-02 13:00:00	2026-06-02 16:30:00	1000	2026-05-06 14:37:48.491
cmou5w4lo002bpn26lfogvo7w	cmou5w4lf000mpn26nw0qq6ho	cmou5w4la000apn26n7fva0rt	2026-06-02 16:00:00	2026-06-02 18:15:00	1000	2026-05-06 14:37:48.491
cmou5w4lo002cpn26ckg5td87	cmou5w4lf000epn26202t76cv	cmou5w4la000dpn26k9jcb1jx	2026-06-03 10:00:00	2026-06-03 12:58:00	1000	2026-05-06 14:37:48.491
cmou5w4lo002dpn2661idwfug	cmou5w4lf000fpn26z98kvkrb	cmou5w4la0004pn26m4katt8k	2026-06-03 13:00:00	2026-06-03 16:02:00	1000	2026-05-06 14:37:48.491
cmou5w4lo002epn26sp7hfn35	cmou5w4lf000gpn26koc8bm9i	cmou5w4la0005pn26k6n8zhk6	2026-06-03 16:00:00	2026-06-03 19:19:00	1000	2026-05-06 14:37:48.491
cmou5w4lo002fpn26y2uwwnil	cmou5w4lf000ipn267ir0jm76	cmou5w4la0007pn26oioijdlg	2026-06-04 10:00:00	2026-06-04 12:42:00	1000	2026-05-06 14:37:48.491
cmou5w4lo002gpn26mepxhstj	cmou5w4lf000jpn26bw2aqhov	cmou5w4la0008pn26yl2p876a	2026-06-04 13:00:00	2026-06-04 15:32:00	1000	2026-05-06 14:37:48.491
cmou5w4lo002hpn26aeqzw92c	cmou5w4lf000kpn26ybvypynb	cmou5w4la0009pn26u5jmnsye	2026-06-04 16:00:00	2026-06-04 19:16:00	1000	2026-05-06 14:37:48.491
\.


--
-- Data for Name: Ticket; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Ticket" (id, "userId", kind, "usesRemaining", "purchasedAt") FROM stdin;
\.


--
-- Data for Name: TicketUsage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TicketUsage" (id, "ticketId", "sessionId", "usedAt") FROM stdin;
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Transaction" (id, "userId", "amountCents", kind, "ticketId", "createdAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, email, "passwordHash", role, "balanceCents", "createdAt") FROM stdin;
cmou5w4hf0000pn2628vhn72m	superadmin@cinema.test	$argon2id$v=19$m=65536,t=3,p=4$xDOje2ymfqXWFZcTSNLtnw$rsI76RGmOOQsax9EjjmgqPq2iQQlavwL5NnNUXSYidw	SUPER_ADMIN	0	2026-05-06 14:37:48.34
cmou5w4ir0001pn26vuh5i9el	admin@cinema.test	$argon2id$v=19$m=65536,t=3,p=4$xBs/WErGFRz6aOsvOvahxw$NhmkxGJfPSxBqJaD/6AxH9rldewPHIKIVC0/d/Sj2Mg	ADMIN	0	2026-05-06 14:37:48.387
cmou5w4jz0002pn26exv8afyx	alice@cinema.test	$argon2id$v=19$m=65536,t=3,p=4$HUMVG2PjjZgIYFHKh2P14Q$40AnadPxeAXPtSxqjFkTjXJHQ3aWVidz/7EEHe9soi4	CLIENT	5000	2026-05-06 14:37:48.431
cmou5w4l60003pn26e4yftezn	bob@cinema.test	$argon2id$v=19$m=65536,t=3,p=4$haiKgbOGzU4d4kA1mUca+Q$Z+wLXxPYvA+rPOqsxFRKgLSHeKZjjejLageVukSZU5g	CLIENT	1500	2026-05-06 14:37:48.475
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
d4f79200-8c33-4701-bae9-2579a72f1350	bb76775f35d0cedfab402b261bde7f2b25a17acfc3b49dd10016fa7a7863d0ae	2026-05-06 14:15:07.332987+00	20260503233414_init	\N	\N	2026-05-06 14:15:06.978399+00	1
\.


--
-- Name: EmployeeShift EmployeeShift_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmployeeShift"
    ADD CONSTRAINT "EmployeeShift_pkey" PRIMARY KEY (id);


--
-- Name: Movie Movie_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Movie"
    ADD CONSTRAINT "Movie_pkey" PRIMARY KEY (id);


--
-- Name: RefreshToken RefreshToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_pkey" PRIMARY KEY (id);


--
-- Name: Room Room_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Room"
    ADD CONSTRAINT "Room_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: TicketUsage TicketUsage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TicketUsage"
    ADD CONSTRAINT "TicketUsage_pkey" PRIMARY KEY (id);


--
-- Name: Ticket Ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_pkey" PRIMARY KEY (id);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: EmployeeShift_startsAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EmployeeShift_startsAt_idx" ON public."EmployeeShift" USING btree ("startsAt");


--
-- Name: EmployeeShift_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EmployeeShift_userId_idx" ON public."EmployeeShift" USING btree ("userId");


--
-- Name: RefreshToken_tokenHash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON public."RefreshToken" USING btree ("tokenHash");


--
-- Name: RefreshToken_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RefreshToken_userId_idx" ON public."RefreshToken" USING btree ("userId");


--
-- Name: Room_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Room_name_key" ON public."Room" USING btree (name);


--
-- Name: Session_movieId_startsAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Session_movieId_startsAt_idx" ON public."Session" USING btree ("movieId", "startsAt");


--
-- Name: Session_roomId_startsAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Session_roomId_startsAt_idx" ON public."Session" USING btree ("roomId", "startsAt");


--
-- Name: TicketUsage_sessionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TicketUsage_sessionId_idx" ON public."TicketUsage" USING btree ("sessionId");


--
-- Name: TicketUsage_ticketId_sessionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "TicketUsage_ticketId_sessionId_key" ON public."TicketUsage" USING btree ("ticketId", "sessionId");


--
-- Name: Ticket_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Ticket_userId_idx" ON public."Ticket" USING btree ("userId");


--
-- Name: Transaction_ticketId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Transaction_ticketId_key" ON public."Transaction" USING btree ("ticketId");


--
-- Name: Transaction_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transaction_userId_createdAt_idx" ON public."Transaction" USING btree ("userId", "createdAt");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: EmployeeShift EmployeeShift_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmployeeShift"
    ADD CONSTRAINT "EmployeeShift_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RefreshToken RefreshToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_movieId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES public."Movie"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Session Session_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public."Room"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TicketUsage TicketUsage_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TicketUsage"
    ADD CONSTRAINT "TicketUsage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."Session"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TicketUsage TicketUsage_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TicketUsage"
    ADD CONSTRAINT "TicketUsage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Ticket Ticket_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Transaction Transaction_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict uSCkqovur3m5faSrXR9DDtPGj1KjPBQRPqxX0e8E8D8hTlbSqYAM7Nf3eTAd95N

