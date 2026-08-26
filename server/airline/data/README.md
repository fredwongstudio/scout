# Airline reference snapshot

`airlines.json` is a checked-in snapshot of the OpenTravelData (OPTD)
`optd_airline_best_known_so_far.csv` dataset, retrieved on 2026-08-26.

- Source: https://github.com/opentraveldata/opentraveldata/blob/master/opentraveldata/optd_airline_best_known_so_far.csv
- Attribution: OpenTravelData contributors
- Source licence: CC BY 4.0

The snapshot contains 1,086 distinct active two-character IATA designators.
Records with an end date are excluded. When a controlled duplicate has exactly
one passenger (`P`) record, that passenger record is retained; otherwise the
code is omitted so SCOUT safely falls back to displaying the original carrier
code rather than inventing an airline name.
