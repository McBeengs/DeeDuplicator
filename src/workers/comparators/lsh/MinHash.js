"use strict";
exports.__esModule = true;
/**
 * MinHash is a hashing scheme that tents to produce similar signatures for sets
 * that have a high Jaccard similarity.
 *
 * The Jaccard similarity between two sets is the relative number of elements
 * these sets have in common: J(A, B) = |A ∩ B| / |A ∪ B| A MinHash signature is
 * a sequence of numbers produced by multiple hash functions hi. It can be shown
 * that the Jaccard similarity between two sets is also the probability that
 * this hash result is the same for the two sets: J(A, B) = Pr[hi(A) = hi(B)].
 * Therefore, MinHash signatures can be used to estimate Jaccard similarity
 * between two sets. Moreover, it can be shown that the expected estimation
 * error is O(1 / sqrt(n)), where n is the size of the signature (the number of
 * hash functions that are used to produce the signature).
 *
 */
var MinHash = /** @class */ (function () {
    function MinHash(size, error, dict_size) {
        if (error === void 0) { error = null; }
        this.LARGE_PRIME = 2147483647;
        if (error) {
            size = this.size(error);
        }
        if (size <= 0) {
            throw "Signature size should be positive";
        }
        if (dict_size <= 0) {
            throw "Dictionary size (or vector size) should be positive";
        }
        // In function h(i, x) the largest value could be
        // dict_size * dict_size + dict_size
        // throw an error if dict_size * dict_size + dict_size > Long.MAX_VALUE
        if (dict_size > (Number.MAX_VALUE - dict_size) / dict_size) {
            throw "Dictionary size (or vector size) is too big and will cause a multiplication overflow";
        }
        this.dict_size = dict_size;
        this.n = size;
        // h = (a * x) + b
        // a and b should be randomly generated in [1,PRIME-1]
        this.hash_coefs = new Array(this.n);

        for (var i = 0; i < this.hash_coefs.length; i++) {
            this.hash_coefs[i] = new Array(2);
        }

        for (var i = 0; i < this.n; i++) {
            this.hash_coefs[i][0] = Math.floor(Math.random() * (this.LARGE_PRIME - 1) + 1); // a
            this.hash_coefs[i][1] = Math.floor(Math.random() * (this.LARGE_PRIME - 1) + 1); // b
        }
    }
    /**
     * Computes the size of the signature required to achieve a given error in
     * similarity estimation. (1 / error^2)
     *
     * @param error
     * @return size of the signature
     */
    MinHash.prototype.size = function (error) {
        if (error < 0 && error > 1) {
            throw "error should be in [0 .. 1]";
        }
        return (1 / (error * error));
    };
    /**
     * Compute the jaccard index between two sets.
     * @param s1
     * @param s2
     * @return
     */
    MinHash.prototype.jaccardIndex = function (s1, s2) {
        // let intersection: Set<number> = new Set<number>(s1);
        // intersection.retainAll(s2);
        // Set<Integer> union = new HashSet<Integer>(s1);
        // union.addAll(s2);
        // if (union.isEmpty()) {
        //     return 0;
        // }
        // return (double) intersection.size() / union.size();
        return 0;
    };
    /**
     * Computes the signature for this set. For example set = {0, 2, 3}
     *
     * @param set
     * @return the signature
     */
    MinHash.prototype.signature = function (set) {
        var sig = new Array(this.n);
        for (var i = 0; i < this.n; i++) {
            sig[i] = Number.MAX_VALUE;
        }
        // For each row r:
        //for (int r = 0; r < dict_size; r++) {
        // if set has 0 in row r, do nothing
        //    if (!set.contains(r)) {
        //        continue;
        //    }
        // Loop over true values, instead of loop over all values of dictionary
        // to speedup computation
        var list = new Array();

        for (var i = 0; i < set.length; i++) {
            list.push(set[i]);
        }

        list.sort(function (a, b) { return a - b; });
        for (var j = 0; j < list.length; j++) {
            var r = list[j];
            // However, if c has 1 in row r, then for each i = 1, 2, . . . ,n
            // set SIG(i, c) to the smaller of the current value of
            // SIG(i, c) and hi(r)
            for (var i = 0; i < this.n; i++) {
                sig[i] = Math.min(sig[i], this.h(i, r));
            }
        }
        return sig;
    };
    /**
     * Computes hi(x) as (a_i * x + b_i) % LARGE_PRIME .
     *
     * @param i
     * @param x
     * @return the hashed value of x, using ith hash function
     */
    MinHash.prototype.h = function (i, x) {
        return ((this.hash_coefs[i][0] * x + this.hash_coefs[i][1]) % this.LARGE_PRIME);
    };
    /**
     * Get the coefficients used by hash function hi.
     * @return
     */
    MinHash.prototype.getCoefficients = function () {
        return this.hash_coefs;
    };
    return MinHash;
}());
exports.MinHash = MinHash;
