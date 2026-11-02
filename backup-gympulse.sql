--
-- PostgreSQL database dump
--

\restrict lcd4gjvRTQhWiJ20sulJiEPgCLoJOaJAcDU4ytx4ePVoxm0GERUWgFc0rCyXxNM

-- Dumped from database version 17.11 (Debian 17.11-1.pgdg13+2)
-- Dumped by pg_dump version 17.11 (Debian 17.11-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: CodiceEmail; Type: TABLE; Schema: public; Owner: gympulse
--

CREATE TABLE public."CodiceEmail" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    scopo text NOT NULL,
    email text NOT NULL,
    chiave text NOT NULL,
    "codiceHash" text NOT NULL,
    tentativi integer DEFAULT 0 NOT NULL,
    "creatoIl" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "scadeIl" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CodiceEmail" OWNER TO gympulse;

--
-- Name: CodiceEmail_id_seq; Type: SEQUENCE; Schema: public; Owner: gympulse
--

CREATE SEQUENCE public."CodiceEmail_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."CodiceEmail_id_seq" OWNER TO gympulse;

--
-- Name: CodiceEmail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gympulse
--

ALTER SEQUENCE public."CodiceEmail_id_seq" OWNED BY public."CodiceEmail".id;


--
-- Name: Esercizio; Type: TABLE; Schema: public; Owner: gympulse
--

CREATE TABLE public."Esercizio" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    nome text NOT NULL,
    muscoli text NOT NULL,
    CONSTRAINT "Esercizio_muscoli_standard" CHECK ((muscoli = ANY (ARRAY[''::text, 'PETTO'::text, 'SPALLE'::text, 'BICIPITI'::text, 'TRICIPITI'::text, 'DORSO'::text, 'GAMBE'::text, 'ADDOME'::text])))
);


ALTER TABLE public."Esercizio" OWNER TO gympulse;

--
-- Name: Esercizio_id_seq; Type: SEQUENCE; Schema: public; Owner: gympulse
--

CREATE SEQUENCE public."Esercizio_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Esercizio_id_seq" OWNER TO gympulse;

--
-- Name: Esercizio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gympulse
--

ALTER SEQUENCE public."Esercizio_id_seq" OWNED BY public."Esercizio".id;


--
-- Name: GiornoScheda; Type: TABLE; Schema: public; Owner: gympulse
--

CREATE TABLE public."GiornoScheda" (
    id text NOT NULL,
    "userId" integer NOT NULL,
    titolo text NOT NULL,
    attiva boolean DEFAULT true NOT NULL
);


ALTER TABLE public."GiornoScheda" OWNER TO gympulse;

--
-- Name: RegistrazioneSospesa; Type: TABLE; Schema: public; Owner: gympulse
--

CREATE TABLE public."RegistrazioneSospesa" (
    id text NOT NULL,
    "fullName" text NOT NULL,
    username text NOT NULL,
    "passwordHash" text NOT NULL,
    email text NOT NULL,
    chiave text NOT NULL,
    "codiceHash" text NOT NULL,
    tentativi integer DEFAULT 0 NOT NULL,
    "creatoIl" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "scadeIl" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RegistrazioneSospesa" OWNER TO gympulse;

--
-- Name: SerieEseguita; Type: TABLE; Schema: public; Owner: gympulse
--

CREATE TABLE public."SerieEseguita" (
    id text NOT NULL,
    "userId" integer NOT NULL,
    "sessioneId" integer NOT NULL,
    "esercizioId" integer NOT NULL,
    ordine integer NOT NULL,
    "pesoKg" double precision,
    ripetizioni integer NOT NULL
);


ALTER TABLE public."SerieEseguita" OWNER TO gympulse;

--
-- Name: Sessione; Type: TABLE; Schema: public; Owner: gympulse
--

CREATE TABLE public."Sessione" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "giornoId" text NOT NULL,
    data timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    note text,
    "durataMinuti" integer,
    "datiIniziali" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Sessione" OWNER TO gympulse;

--
-- Name: Sessione_id_seq; Type: SEQUENCE; Schema: public; Owner: gympulse
--

CREATE SEQUENCE public."Sessione_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Sessione_id_seq" OWNER TO gympulse;

--
-- Name: Sessione_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gympulse
--

ALTER SEQUENCE public."Sessione_id_seq" OWNED BY public."Sessione".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: gympulse
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    "fullName" text NOT NULL,
    username text NOT NULL,
    "passwordHash" text NOT NULL,
    email text
);


ALTER TABLE public."User" OWNER TO gympulse;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: gympulse
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO gympulse;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gympulse
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: VoceScheda; Type: TABLE; Schema: public; Owner: gympulse
--

CREATE TABLE public."VoceScheda" (
    id text NOT NULL,
    "userId" integer NOT NULL,
    "giornoId" text NOT NULL,
    "esercizioId" integer NOT NULL,
    ordine integer NOT NULL,
    tipo text DEFAULT 'serie'::text NOT NULL,
    serie integer,
    "ripMin" integer,
    "ripMax" integer,
    "recuperoSec" integer,
    "ripTotali" integer,
    "serieMin" integer,
    "serieMax" integer,
    nota text,
    "incrementoKg" double precision
);


ALTER TABLE public."VoceScheda" OWNER TO gympulse;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: gympulse
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


ALTER TABLE public._prisma_migrations OWNER TO gympulse;

--
-- Name: CodiceEmail id; Type: DEFAULT; Schema: public; Owner: gympulse
--

ALTER TABLE ONLY public."CodiceEmail" ALTER COLUMN id SET DEFAULT nextval('public."CodiceEmail_id_seq"'::regclass);


--
-- Name: Esercizio id; Type: DEFAULT; Schema: public; Owner: gympulse
--

ALTER TABLE ONLY public."Esercizio" ALTER COLUMN id SET DEFAULT nextval('public."Esercizio_id_seq"'::regclass);


--
-- Name: Sessione id; Type: DEFAULT; Schema: public; Owner: gympulse
--

ALTER TABLE ONLY public."Sessione" ALTER COLUMN id SET DEFAULT nextval('public."Sessione_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: gympulse
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: CodiceEmail; Type: TABLE DATA; Schema: public; Owner: gympulse
--

COPY public."CodiceEmail" (id, "userId", scopo, email, chiave, "codiceHash", tentativi, "creatoIl", "scadeIl") FROM stdin;
1	1	email	emanuelebuemi2501@gmail.com	emanuelebuemi2501@gmail.com	xxyYa6Tj2aPlOsh6n5mhZmem3uG10oMt9ev_lbPpnBg	1	2026-11-01 10:11:02.926	1970-01-01 00:00:00
2	1	recupero	emanuelebuemi2501@gmail.com	emanuelebuemi2501@gmail.com	UiyPtKQh0-l6NkmkV4fqaJxXnYrwFX5nnEYG1Lm2UFA	1	2026-11-01 10:12:11.873	1970-01-01 00:00:00
3	1	email	emanuelebuemu2501@gmail.com	emanuelebuemu2501@gmail.com	n4KuUI74WWkheR8vsapdtzE-AbDxINW9VGcU89sOgCI	1	2026-11-02 16:19:55.955	1970-01-01 00:00:00
4	1	recupero	emanuelebuemu2501@gmail.com	emanuelebuemu2501@gmail.com	zijcvqqP20yqhgR878gwSUu8cNnhBzvtQUPDQmMza1g	1	2026-11-02 16:20:18.525	1970-01-01 00:00:00
\.


--
-- Data for Name: Esercizio; Type: TABLE DATA; Schema: public; Owner: gympulse
--

COPY public."Esercizio" (id, "userId", nome, muscoli) FROM stdin;
28	3	Chest Press Convergente	PETTO
29	3	Incline Chest Press alla Smith Machine	PETTO
30	3	Pec Deck (Butterfly)	PETTO
31	3	Croci ai Cavi dal Basso Pettorali, isolamento P	PETTO
32	3	Pushdown al Cavo con Barra a V	TRICIPITI
33	3	Estensioni Tricipiti sopra la Testa con Corda	TRICIPITI
34	3	Addome a Piacere	ADDOME
1	1	Panca piana	PETTO
2	1	Panca inclinata con manubri	PETTO
3	1	Croci ai cavi 30°	PETTO
4	1	Lat presa inversa stretta	DORSO
5	1	Curl con bilanciere EZ angolato	BICIPITI
40	3	Lat Machine a Presa Neutra	DORSO
41	3	Rematore Iso-Laterale alla Macchina	DORSO
42	3	Rematore T-Bar con Supporto al Petto	DORSO
43	3	Curl alla Scott Machine	BICIPITI
44	3	Curl Bayesian al Cavo Basso	BICIPITI
45	3	Addome alla sbarra	ADDOME
35	3	Hack Squat Machine	GAMBE
36	3	Pressa Orizzontale	GAMBE
37	3	Glute Drive Machine	GAMBE
38	3	Calf Raise da Seduto	GAMBE
39	3	Crunch al Cavo in Ginocchio	ADDOME
46	3	Shoulder Press Machine	SPALLE
47	3	Alzate Laterali alla Macchina	SPALLE
48	3	Reverse Pec Deck	SPALLE
49	3	Face Pull con Corda	SPALLE
50	3	Reverse Crunch su Panca	ADDOME
7	1	Dip alla macchina	TRICIPITI
8	1	Addome a piacere	ADDOME
9	1	Calf in piedi (macchina)	GAMBE
10	1	Squat con bilanciere	GAMBE
11	1	Pressa 45°	GAMBE
12	1	Leg extension	GAMBE
13	1	Leg curl sdraiato	GAMBE
14	1	Leg curl da seduto	GAMBE
15	1	Addome alla sbarra	ADDOME
16	1	Stacco da terra	DORSO
17	1	Lat machine avanti	DORSO
18	1	Pulley basso	DORSO
19	1	Pullover con manubrio	DORSO
20	1	Rematore petto su panca	DORSO
21	1	Lento avanti con manubri	SPALLE
22	1	Alzate laterali	SPALLE
23	1	Addome alla macchina	ADDOME
6	1	Curl con manubri alternato	BICIPITI
\.


--
-- Data for Name: GiornoScheda; Type: TABLE DATA; Schema: public; Owner: gympulse
--

COPY public."GiornoScheda" (id, "userId", titolo, attiva) FROM stdin;
B	1	Gambe	t
C	1	Stacco, dorso, spalle	t
A	1	Petto, dorso, braccia	t
A	3	PETTO, TRICIPITI	t
C	3	DORSO, BICIPITI	t
B	3	GAMBE	t
D	3	SPALLE	t
\.


--
-- Data for Name: RegistrazioneSospesa; Type: TABLE DATA; Schema: public; Owner: gympulse
--

COPY public."RegistrazioneSospesa" (id, "fullName", username, "passwordHash", email, chiave, "codiceHash", tentativi, "creatoIl", "scadeIl") FROM stdin;
e0b5163f-0fb7-4611-82ce-de07a428d311	Luca Bianchi	luca		lucabianchiprova@gmail.com	lucabianchiprova@gmail.com	KEkC7u2B77mk8RThZdq0VSrF3xLsCO6LDJoDfx8ZycA	1	2026-11-01 13:15:12.019	1970-01-01 00:00:00
\.


--
-- Data for Name: SerieEseguita; Type: TABLE DATA; Schema: public; Owner: gympulse
--

COPY public."SerieEseguita" (id, "userId", "sessioneId", "esercizioId", ordine, "pesoKg", ripetizioni) FROM stdin;
cmvuz9574001dxk4fftrqkgq7	1	2	1	1	40	6
cmvuz9574001exk4fbaj2wk5q	1	2	1	2	50	6
cmvuz9574001fxk4fr40wfjwf	1	2	1	3	50	6
cmvuz9574001gxk4fbgc9h2kp	1	2	1	4	50	6
cmvuz9574001hxk4fe81sbnjd	1	2	2	5	12.5	8
cmvuz9574001ixk4ftwlft8wa	1	2	2	6	14	8
cmvuz9574001jxk4fkx97zp8f	1	2	2	7	14	8
cmvuz9574001kxk4fgyod7ygd	1	2	3	8	15	10
cmvuz9574001lxk4f55phh1je	1	2	3	9	15	10
cmvuz9574001mxk4fcfyqwhnq	1	2	3	10	17.5	10
cmvuz9574001nxk4f85nqi2uq	1	2	3	11	17.5	10
cmvuz9574001oxk4fimphv2q6	1	2	4	12	40	8
cmvuz9574001pxk4fpxqv4w21	1	2	4	13	45	8
cmvuz9574001qxk4frfcpae3w	1	2	4	14	45	8
cmvuz9574001rxk4fdm6bkmz4	1	2	5	15	25	8
cmvuz9574001sxk4fvxf3xqhe	1	2	5	16	25	8
cmvuz9574001txk4f32bcbp8q	1	2	5	17	25	8
cmvuz9574001uxk4fvlr1o28o	1	2	5	18	25	8
cmvuz9574001yxk4fa3b4kshg	1	2	7	22	25	10
cmvuz9574001zxk4f1e8r9mzg	1	2	7	23	30	10
cmvuz95740020xk4f8zx1wx02	1	2	7	24	37.5	10
cmvuz957k002ixk4f70e5iv60	1	3	9	18	110	15
cmvuz957k002jxk4fr3cgfwji	1	3	9	19	110	15
cmvuz957k002kxk4f2f6sislb	1	3	9	20	130	15
cmvuz957k002lxk4fuhvmi1rs	1	3	9	21	130	15
cmvuz957k0021xk4fmmrw9xbh	1	3	10	1	50	6
cmvuz957k0022xk4fo2h7hy5e	1	3	10	2	60	6
cmvuz957k0023xk4fb448vpqm	1	3	10	3	70	6
cmvuz957k0024xk4fl68g8jos	1	3	10	4	75	6
cmvuz957k0025xk4f2ix5keel	1	3	11	5	120	12
cmvuz957k0026xk4fdmkhrihk	1	3	11	6	150	12
cmvuz957k0027xk4fdbo96lq6	1	3	11	7	160	12
cmvuz957k0028xk4fxevy5xni	1	3	12	8	35	15
cmvuz957k0029xk4fpvvnr9l4	1	3	12	9	35	15
cmvuz957k002axk4f5rm0ynpl	1	3	12	10	40	15
cmvuz957k002bxk4f04gbsgzz	1	3	13	11	30	10
cmvuz957k002cxk4f0esej0f1	1	3	13	12	35	10
cmvuz957k002dxk4f1o2j5ebw	1	3	13	13	35	10
cmvuz957k002exk4fogkwqan9	1	3	13	14	40	10
cmvuz957k002fxk4fmnrzpkku	1	3	14	15	40	12
cmvuz957k002gxk4fc2cifbpq	1	3	14	16	45	12
cmvuz957k002hxk4fuef3imli	1	3	14	17	50	12
cmvuz957k002mxk4fcwgpt0ch	1	3	15	22	\N	15
cmvuz957k002nxk4f9qlsyeb0	1	3	15	23	\N	15
cmvuz957k002oxk4fp83xfog1	1	3	15	24	\N	20
cmvuz956o000nxk4foww3noub	1	1	16	1	20	5
cmvuz956o000oxk4ft9jjr72u	1	1	16	2	30	5
cmvuz956o000pxk4fro96tsuw	1	1	16	3	40	5
cmvuz956o000qxk4fzv8ieo7w	1	1	17	4	40	8
cmvuz956o000rxk4f73c01tld	1	1	17	5	45	8
cmvuz956o000sxk4fvjjppsui	1	1	17	6	50	8
cmvuz956o000txk4f1ne2i1es	1	1	17	7	50	8
cmvuz956o000uxk4ffi4z2vks	1	1	18	8	40	10
cmvuz956o000vxk4frutfzmn9	1	1	18	9	40	10
cmvuz956o000wxk4fuj0m7jrg	1	1	18	10	40	10
cmvuz956o000xxk4f01yn0l8g	1	1	19	11	20	10
cmvuz956o000yxk4fixykcqxz	1	1	19	12	20	10
cmvuz956o000zxk4f5mikesu6	1	1	19	13	20	10
cmvuz956p0010xk4fzfflv62i	1	1	20	14	12.5	12
cmvuz956p0011xk4fkdwu2irl	1	1	20	15	12.5	12
cmvuz956p0012xk4fm7a5wu2f	1	1	20	16	12.5	12
cmvuz956p0013xk4fqfzhh66q	1	1	21	17	12.5	8
cmvuz956p0014xk4f40xwcppy	1	1	21	18	12.5	8
cmvuz956p0015xk4fx7htrlp9	1	1	21	19	14	8
cmvuz956p0016xk4fub0e31kt	1	1	22	20	7	10
cmvuz956p0017xk4fst3jmnjd	1	1	22	21	7	10
cmvuz956p0018xk4fnrjjmagm	1	1	22	22	7	10
cmvuz956p0019xk4fsiuv4vxd	1	1	23	23	40	15
cmvuz956p001axk4frl6t2npl	1	1	23	24	40	15
cmvuz956p001bxk4fmas7oz2b	1	1	23	25	45	15
cmvuz956p001cxk4f61vo1850	1	1	23	26	50	15
cmvuz9574001vxk4f62a4bnmr	1	2	6	19	10	8
cmvuz9574001wxk4fbyme08yk	1	2	6	20	10	8
cmvuz9574001xxk4f8vlu8qzy	1	2	6	21	10	8
\.


--
-- Data for Name: Sessione; Type: TABLE DATA; Schema: public; Owner: gympulse
--

COPY public."Sessione" (id, "userId", "giornoId", data, note, "durataMinuti", "datiIniziali") FROM stdin;
1	1	C	2026-10-30 18:00:00	\N	\N	t
2	1	A	2026-10-26 18:00:00	\N	\N	t
3	1	B	2026-10-28 18:00:00	\N	\N	t
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: gympulse
--

COPY public."User" (id, "fullName", username, "passwordHash", email) FROM stdin;
2	Mario Rossi	mario	scrypt$32768$8$1$clig0hKGtgkRZ5vfNeAGHA$51AQ-p14JDlrKuj5xKT-L8G1QgJmYE2Wp2O8HIgkaGc	mariorossiprova@gmial.com
3	Luca Bianchi	luca	scrypt$32768$8$1$RuCz25ru74-aTDpFjOnlog$9oR9FivyJBxRAAuXyBN7atSDf9FxrsAC523n9GmNVvs	lucabianchiprova@gmail.com
1	Emanuele Buemi	emanuele	scrypt$32768$8$1$-eOcex3GdkRgvEXmajVkJw$eoCdKj0O2l25xS2BildFujjSXXc4MDepAFg5gjqdDzQ	emanuelebuemu2501@gmail.com
\.


--
-- Data for Name: VoceScheda; Type: TABLE DATA; Schema: public; Owner: gympulse
--

COPY public."VoceScheda" (id, "userId", "giornoId", "esercizioId", ordine, tipo, serie, "ripMin", "ripMax", "recuperoSec", "ripTotali", "serieMin", "serieMax", nota, "incrementoKg") FROM stdin;
ripristino-a-226f8600bfca42b5b6491a9bef9b67bc	1	A	1	1	serie	4	6	6	120	\N	\N	\N	Carico a salire (+5 kg)	5
ripristino-a-19df6d4a8ebe48fd80073abb8272c889	1	A	2	2	serie	3	6	8	120	\N	\N	\N	Panca a 30°, target 8 ripetizioni	\N
ripristino-a-607749079b374830824ba8b6b8233437	1	A	3	3	serie	4	8	10	60	\N	\N	\N	Picco di contrazione per 1 s	\N
ripristino-a-0156f3472a93407cb914b84e463b6b48	1	A	4	4	serie	3	6	8	90	\N	\N	\N	Impugnatura supina stretta	\N
ripristino-a-646031da18cd457fbc212763a105fb6d	1	A	5	5	serie	3	8	10	90	\N	\N	\N	Bilanciere EZ, senza compensi	\N
ripristino-a-592368a46afb4922b2209bf2f0c21f4c	1	A	7	7	serie	3	8	10	60	\N	\N	\N	Busto leggermente inclinato	\N
ripristino-a-2ed651e8d6d64e979cba845951bb9aae	1	A	8	8	libero	\N	\N	\N	\N	\N	3	4	Crunch a terra, plank o reverse crunch	\N
cmvuz955i0008xk4fbejn75iv	1	B	9	1	serie	4	12	15	60	\N	\N	\N	Pausa di 1 s in massima contrazione	\N
cmvuz955i0009xk4fs3ohc0c0	1	B	10	2	serie	4	6	6	120	\N	\N	\N	Carico a salire (+5 kg)	5
cmvuz955i000axk4fz1umcc80	1	B	11	3	serie	3	10	12	120	\N	\N	\N	Escursione profonda senza staccare il bacino	\N
cmvuz955i000bxk4f43v1d5z9	1	B	12	4	serie	3	15	20	60	\N	\N	\N	Spremere in alto per 1 s	\N
cmvuz955i000cxk4fe75b63yi	1	B	13	5	serie	4	8	10	90	\N	\N	\N	Movimento fluido senza strappi	\N
cmvuz955i000dxk4f7o3f7yj2	1	B	14	6	serie	3	10	12	90	\N	\N	\N	Bloccare bene il cuscinetto sulle cosce	\N
cmvuz955i000exk4fv68omar0	1	B	15	7	totale	\N	\N	\N	\N	50	\N	\N	Somma delle ripetizioni su più serie	\N
cmvuz9560000fxk4fhh0ynj1n	1	C	16	1	serie	3	5	5	120	\N	\N	\N	Carico a salire (+10 kg)	10
cmvuz9560000gxk4f7n1jertw	1	C	17	2	serie	4	6	8	120	\N	\N	\N	Presa prona larga, petto in fuori	\N
cmvuz9560000hxk4fcx2sa9o8	1	C	18	3	serie	3	10	12	90	\N	\N	\N	Triangolo, petto aperto in chiusura	\N
cmvuz9560000ixk4fsg6w8ki9	1	C	19	4	serie	3	8	10	90	\N	\N	\N	Panca trasversale o piana	\N
cmvuz9560000jxk4fthjjyddk	1	C	20	5	serie	3	8	10	60	\N	\N	\N	Panca a 30°, manubri o bilanciere	\N
cmvuz9560000kxk4fmdxcop8k	1	C	21	6	serie	3	6	8	120	\N	\N	\N	Seduto su panca a 80°-90°	\N
cmvuz9560000lxk4fzyb4cvs3	1	C	22	7	serie	3	8	10	90	\N	\N	\N	Gomiti leggermente flessi	\N
cmvuz9560000mxk4fnrwhni4z	1	C	23	8	serie	4	15	20	60	\N	\N	\N	\N	\N
ripristino-a-75016d7a4b624ccfb879f0f88699a3b3	1	A	6	6	serie	3	8	10	90	\N	\N	\N	\N	\N
cmvzc2q680000ks4fyzh2sx1v	3	A	28	1	serie	4	8	10	120	\N	\N	\N	Schiena aderente allo schienale; chiudi senza bloccare i gomiti.	\N
cmvzc2q6l0001ks4fv0lwupb3	3	A	29	2	serie	3	8	10	120	\N	\N	\N	' Panca inclinata moderata; traiettoria controllata.	\N
cmvzc2q6x0002ks4fnieuklt5	3	A	30	3	serie	3	12	12	60	\N	\N	\N	Mantieni 1 secondo di contrazione in chiusura.	\N
cmvzc2q760003ks4fmmkn7wx8	3	A	31	4	serie	2	12	15	60	\N	\N	\N	Porta le mani verso l'alto e al centro senza slancio.	\N
cmvzc2q7j0004ks4f4q7q81r8	3	A	32	5	serie	3	10	10	90	\N	\N	\N	Gomiti fermi vicino al busto.	\N
cmvzc2q7t0005ks4fxew45wm4	3	A	33	6	serie	3	12	15	60	\N	\N	\N	Allunga bene dietro la testa, senza inarcare la schiena.	\N
cmvzc2q830006ks4f6fnpwkbd	3	A	34	7	serie	3	20	20	60	\N	\N	\N	Crunch a terra, Plank o Reverse Crunch	\N
cmvzcit4y000cks4fz82knup9	3	C	40	1	serie	4	8	10	120	\N	\N	\N	Porta le maniglie verso la parte alta del petto.	\N
cmvzcit57000dks4f82vpoldx	3	C	41	2	serie	3	10	12	90	\N	\N	\N	Tira i gomiti indietro senza sollevare le spalle.	\N
cmvzcit5h000eks4f11jppk9t	3	C	42	3	serie	4	8	10	90	\N	\N	\N	Mantieni il petto appoggiato al supporto	\N
cmvzcit6a000fks4fsqjvt482	3	C	43	4	serie	3	10	10	90	\N	\N	\N	Non staccare le braccia dal cuscino.	\N
cmvzcit6k000gks4fdyj5qscm	3	C	44	5	serie	3	12	15	60	\N	\N	\N	Braccio leggermente dietro il busto; niente slanci.	\N
cmvzcit6w000hks4fw9z826vx	3	C	45	6	serie	3	8	8	90	\N	\N	\N	\N	\N
cmvzcj71o000iks4fpno7cg36	3	B	35	1	serie	4	8	10	120	\N	\N	\N	Scendi fin dove mantieni il bacino stabile.	5
cmvzcj71w000jks4f53m7ktkd	3	B	36	2	serie	3	10	12	120	\N	\N	\N	Non estendere completamente le ginocchia.	10
cmvzcj722000kks4fk31ua6gs	3	B	37	3	serie	3	10	10	90	\N	\N	\N	Pausa breve in massima contrazione.	\N
cmvzcj728000lks4fp8qdwkfx	3	B	38	4	serie	4	15	15	60	\N	\N	\N	Fermati un secondo in allungamento e in contrazione.	\N
cmvzcj72d000mks4f7k7sv5s1	3	B	39	5	serie	3	12	15	90	\N	\N	\N	Fletti il busto avvicinando coste e bacino.	\N
cmvzcoj8a000nks4fzs0u3bde	3	D	46	1	serie	3	8	10	120	\N	\N	\N	Regola il sedile per partire con le maniglie circa all'altezza delle orecchie.	\N
cmvzcoj8q000oks4fetj2v1qj	3	D	47	2	serie	4	12	15	60	\N	\N	\N	Solleva fino circa all'altezza delle spalle, senza slancio.	\N
cmvzcoj96000pks4fb4941627	3	D	48	3	serie	3	12	15	90	\N	\N	\N	Apri le braccia mantenendo il petto sul supporto.	5
cmvzcoj9k000qks4foy5q9uum	3	D	49	4	serie	2	15	15	60	\N	\N	\N	Tira verso il viso con gomiti alti e controllati.	\N
cmvzcoj9v000rks4f9xlfw5hj	3	D	50	5	serie	3	12	15	90	\N	\N	\N	Arrotola il bacino verso il torace, senza slancio.	\N
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: gympulse
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
b51e0f66-bd9c-443f-93a6-136f601a47f2	8e5064c94886e36101f60b405b69d2b41f016837eb3626c093dbcb1c7c077dae	2026-10-29 14:53:46.530374+00	20261029145346_init	\N	\N	2026-10-29 14:53:46.464372+00	1
744472c0-654d-4204-8c85-f96b1b5d44cf	473d975e6aeafb74e7d312b4799700f73f8b1ae92a0f58414c6b523b52a1e944	2026-11-02 12:31:38.633767+00	20261102100000_senza_dati_orologio	\N	\N	2026-11-02 12:31:38.564833+00	1
0b66e3b5-1985-4ece-9a4f-225e49e3037d	0a70afd27c0cd55af5be11af24eb012647140abbb1818936f32611f2e26b2181	2026-10-30 12:57:15.042099+00	20261030125625_diario_abc	\N	\N	2026-10-30 12:57:14.992735+00	1
1c5262ee-5d29-484b-bbbe-13d26f9bd3d6	b094e438eb09185c1975fcf4bca66f6805c8fba528962e2150c09c3e04c5ce20	2026-10-30 20:44:08.843529+00	20261030150000_login_utente	\N	\N	2026-10-30 20:44:08.809741+00	1
1a661027-cad0-4c3d-abb4-a2648ad8c201	29b5759ee96c434340faefb37bd9f3a8f3f23b77cd554ffe5dae8e68b7cf9afd	2026-10-30 20:44:08.989428+00	20261030160000_dati_per_utente	\N	\N	2026-10-30 20:44:08.847071+00	1
d7666cdf-c1b7-4af1-8d92-b17f63943895	cc3b731c7024737135abb3abd1b9ac3434c85b6a961e091320cc3acefc5825c1	2026-10-30 22:49:05.336502+00	20261030170000_utente_con_id_numerico	\N	\N	2026-10-30 22:49:05.287362+00	1
263abffc-169b-456d-9bc6-25de8063fefa	dfba09f6303533a5d754881750ad7be7ac1896fc56e8a334f36e6bd8cd187667	2026-10-31 13:59:58.448826+00	20261031100000_tabelle_riordinate	\N	\N	2026-10-31 13:59:58.417828+00	1
3b892c51-80cd-4aae-befe-cc1d46d3495d	66cd049c33ec66bc9bc086d17ffbaa14dfb4db789db470553a271d936790348b	2026-10-31 16:15:09.078952+00	20261031110000_senza_peso_corporeo	\N	\N	2026-10-31 16:15:09.053064+00	1
8c1d7077-8a4e-4fb5-bbb1-3857a6528e76	22a6c44a3a5cde0c9910d53e1ec421af4662a0a59de92dc31ec4943716170b36	2026-10-31 16:41:35.302108+00	20261031120000_dati_orologio	\N	\N	2026-10-31 16:41:35.28301+00	1
f466095a-d9aa-4fe0-8e34-740062f3012b	7e2384e572a8b8f3b466c33fb4639e2a985c142d928302695a81e24576b9c52a	2026-10-31 18:04:19.614607+00	20261031130000_codice_recupero	\N	\N	2026-10-31 18:04:19.557828+00	1
fe395706-a92f-4638-a529-ceb18650fa93	19e5baa8835dd4070047c739aa2839c48aa2de454151dc81f7187ede0b14611d	2026-11-01 09:59:34.377854+00	20261031150000_email_al_posto_del_telefono	\N	\N	2026-11-01 09:59:34.312098+00	1
ac8ab998-add8-4bd0-bad1-2e8feb7cd849	ca81320c0dc5d281528282e6f4987b27679bd55c9fb04d876c9776ec48f4d39d	2026-11-01 11:59:24.582848+00	20261101100000_giornate_archiviabili	\N	\N	2026-11-01 11:59:24.568241+00	1
51957dee-808f-45c8-88e8-3deecfacd7b0	c240da0fd6f8fbd85a5700e2c7dfda7368f51eab69122f12d0d4028234490eaf	2026-11-01 18:03:39.47779+00	20261101120000_muscoli_standard	\N	\N	2026-11-01 18:03:39.458502+00	1
\.


--
-- Name: CodiceEmail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gympulse
--

SELECT pg_catalog.setval('public."CodiceEmail_id_seq"', 4, true);


--
-- Name: Esercizio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gympulse
--

SELECT pg_catalog.setval('public."Esercizio_id_seq"', 50, true);


--
-- Name: Sessione_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gympulse
--

SELECT pg_catalog.setval('public."Sessione_id_seq"', 3, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gympulse
--

SELECT pg_catalog.setval('public."User_id_seq"', 3, true);


--
-- Name: CodiceEmail CodiceEmail_pkey; Type: CONSTRAINT; Schema: public; Owner: gympulse
--

ALTER TABLE ONLY public."CodiceEmail"
    ADD CONSTRAINT "CodiceEmail_pkey" PRIMARY KEY (id);


--
-- Name: Esercizio Esercizio_pkey; Type: CONSTRAINT; Schema: public; Owner: gympulse
--

ALTER TABLE ONLY public."Esercizio"
    ADD CONSTRAINT "Esercizio_pkey" PRIMARY KEY (id);


--
-- Name: GiornoScheda GiornoScheda_pkey; Type: CONSTRAINT; Schema: public; Owner: gympulse
--

ALTER TABLE ONLY public."GiornoScheda"
    ADD CONSTRAINT "GiornoScheda_pkey" PRIMARY KEY ("userId", id);


--
-- Name: RegistrazioneSospesa RegistrazioneSospesa_pkey; Type: CONSTRAINT; Schema: public; Owner: gympulse
--

ALTER TABLE ONLY public."RegistrazioneSospesa"
    ADD CONSTRAINT "RegistrazioneSospesa_pkey" PRIMARY KEY (id);


--
-- Name: SerieEseguita SerieEseguita_pkey; Type: CONSTRAINT; Schema: public; Owner: gympulse
--

ALTER TABLE ONLY public."SerieEseguita"
    ADD CONSTRAINT "SerieEseguita_pkey" PRIMARY KEY (id);


--
-- Name: Sessione Sessione_pkey; Type: CONSTRAINT; Schema: public; Owner: gympulse
--

ALTER TABLE ONLY public."Sessione"
    ADD CONSTRAINT "Sessione_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: gympulse
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: VoceScheda VoceScheda_pkey; Type: CONSTRAINT; Schema: public; Owner: gympulse
--

ALTER TABLE ONLY public."VoceScheda"
    ADD CONSTRAINT "VoceScheda_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: gympulse
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: CodiceEmail_chiave_creatoIl_idx; Type: INDEX; Schema: public; Owner: gympulse
--

CREATE INDEX "CodiceEmail_chiave_creatoIl_idx" ON public."CodiceEmail" USING btree (chiave, "creatoIl");


--
-- Name: CodiceEmail_creatoIl_idx; Type: INDEX; Schema: public; Owner: gympulse
--

CREATE INDEX "CodiceEmail_creatoIl_idx" ON public."CodiceEmail" USING btree ("creatoIl");


--
-- Name: CodiceEmail_userId_creatoIl_idx; Type: INDEX; Schema: public; Owner: gympulse
--

CREATE INDEX "CodiceEmail_userId_creatoIl_idx" ON public."CodiceEmail" USING btree ("userId", "creatoIl");


--
-- Name: Esercizio_userId_id_key; Type: INDEX; Schema: public; Owner: gympulse
--

CREATE UNIQUE INDEX "Esercizio_userId_id_key" ON public."Esercizio" USING btree ("userId", id);


--
-- Name: RegistrazioneSospesa_chiave_creatoIl_idx; Type: INDEX; Schema: public; Owner: gympulse
--

CREATE INDEX "RegistrazioneSospesa_chiave_creatoIl_idx" ON public."RegistrazioneSospesa" USING btree (chiave, "creatoIl");


--
-- Name: RegistrazioneSospesa_creatoIl_idx; Type: INDEX; Schema: public; Owner: gympulse
--

CREATE INDEX "RegistrazioneSospesa_creatoIl_idx" ON public."RegistrazioneSospesa" USING btree ("creatoIl");


--
-- Name: SerieEseguita_sessioneId_idx; Type: INDEX; Schema: public; Owner: gympulse
--

CREATE INDEX "SerieEseguita_sessioneId_idx" ON public."SerieEseguita" USING btree ("sessioneId");


--
-- Name: SerieEseguita_userId_esercizioId_idx; Type: INDEX; Schema: public; Owner: gympulse
--

CREATE INDEX "SerieEseguita_userId_esercizioId_idx" ON public."SerieEseguita" USING btree ("userId", "esercizioId");


--
-- Name: Sessione_id_userId_key; Type: INDEX; Schema: public; Owner: gympulse
--

CREATE UNIQUE INDEX "Sessione_id_userId_key" ON public."Sessione" USING btree (id, "userId");


--
-- Name: Sessione_userId_data_idx; Type: INDEX; Schema: public; Owner: gympulse
--

CREATE INDEX "Sessione_userId_data_idx" ON public."Sessione" USING btree ("userId", data);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: gympulse
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: VoceScheda_userId_giornoId_esercizioId_key; Type: INDEX; Schema: public; Owner: gympulse
--

CREATE UNIQUE INDEX "VoceScheda_userId_giornoId_esercizioId_key" ON public."VoceScheda" USING btree ("userId", "giornoId", "esercizioId");


--
-- Name: VoceScheda_userId_giornoId_ordine_idx; Type: INDEX; Schema: public; Owner: gympulse
--

CREATE INDEX "VoceScheda_userId_giornoId_ordine_idx" ON public."VoceScheda" USING btree ("userId", "giornoId", ordine);


--
-- Name: CodiceEmail CodiceEmail_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gympulse
--

ALTER TABLE ONLY public."CodiceEmail"
    ADD CONSTRAINT "CodiceEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Esercizio Esercizio_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gympulse
--

ALTER TABLE ONLY public."Esercizio"
    ADD CONSTRAINT "Esercizio_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GiornoScheda GiornoScheda_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gympulse
--

ALTER TABLE ONLY public."GiornoScheda"
    ADD CONSTRAINT "GiornoScheda_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SerieEseguita SerieEseguita_sessioneId_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gympulse
--

ALTER TABLE ONLY public."SerieEseguita"
    ADD CONSTRAINT "SerieEseguita_sessioneId_userId_fkey" FOREIGN KEY ("sessioneId", "userId") REFERENCES public."Sessione"(id, "userId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SerieEseguita SerieEseguita_userId_esercizioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gympulse
--

ALTER TABLE ONLY public."SerieEseguita"
    ADD CONSTRAINT "SerieEseguita_userId_esercizioId_fkey" FOREIGN KEY ("userId", "esercizioId") REFERENCES public."Esercizio"("userId", id) ON UPDATE CASCADE;


--
-- Name: Sessione Sessione_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gympulse
--

ALTER TABLE ONLY public."Sessione"
    ADD CONSTRAINT "Sessione_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Sessione Sessione_userId_giornoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gympulse
--

ALTER TABLE ONLY public."Sessione"
    ADD CONSTRAINT "Sessione_userId_giornoId_fkey" FOREIGN KEY ("userId", "giornoId") REFERENCES public."GiornoScheda"("userId", id) ON UPDATE CASCADE;


--
-- Name: VoceScheda VoceScheda_userId_esercizioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gympulse
--

ALTER TABLE ONLY public."VoceScheda"
    ADD CONSTRAINT "VoceScheda_userId_esercizioId_fkey" FOREIGN KEY ("userId", "esercizioId") REFERENCES public."Esercizio"("userId", id) ON UPDATE CASCADE;


--
-- Name: VoceScheda VoceScheda_userId_giornoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gympulse
--

ALTER TABLE ONLY public."VoceScheda"
    ADD CONSTRAINT "VoceScheda_userId_giornoId_fkey" FOREIGN KEY ("userId", "giornoId") REFERENCES public."GiornoScheda"("userId", id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict lcd4gjvRTQhWiJ20sulJiEPgCLoJOaJAcDU4ytx4ePVoxm0GERUWgFc0rCyXxNM

