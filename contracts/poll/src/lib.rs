#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env, Symbol, String};

const VOTES_A: Symbol = symbol_short!("VOTES_A");
const VOTES_B: Symbol = symbol_short!("VOTES_B");

#[contract]
pub struct PollContract;

#[contractimpl]
impl PollContract {
    pub fn vote(env: Env, option: String) {
        let a = symbol_short!("A");
        let key = if option == String::from_str(&env, "A") {
            VOTES_A
        } else {
            VOTES_B
        };
        let current: u32 = env.storage().instance().get(&key).unwrap_or(0);
        env.storage().instance().set(&key, &(current + 1));
        env.storage().instance().extend_ttl(100, 100);
        let _ = a;
    }

    pub fn get_votes(env: Env) -> (u32, u32) {
        let a: u32 = env.storage().instance().get(&VOTES_A).unwrap_or(0);
        let b: u32 = env.storage().instance().get(&VOTES_B).unwrap_or(0);
        (a, b)
    }
}