import com.seifmolabs.math.GaussSolver;
import com.seifmolabs.objects.ApproxResult;
import com.seifmolabs.objects.Point2D;
import com.seifmolabs.service.ApproximationService;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class MathCoreTest {

    @Test
    void testGaussSolver2x2() {
        // 2x + y = 5 | x - y = 1 => x=2, y=1
        double[][] A = {{2, 1}, {1, -1}};
        double[] B = {5, 1};
        double[] res = GaussSolver.solve(A, B);
        assertNotNull(res);
        assertEquals(2.0, res[0], 1e-9);
        assertEquals(1.0, res[1], 1e-9);
    }

    @Test
    void testGaussSolverSingular() {
        double[][] A = {{1, 1}, {2, 2}};
        double[] B = {2, 4};
        assertNull(GaussSolver.solve(A, B), "Должен вернуть null для вырожденной матрицы");
    }

    @Test
    void testLinearApproximationMetrics() {
        ApproximationService service = new ApproximationService();
        // y = 2x + 1 + small noise
        List<Point2D> points = Arrays.asList(
                new Point2D(1.0, 3.01),
                new Point2D(2.0, 4.99),
                new Point2D(3.0, 7.02),
                new Point2D(4.0, 8.98),
                new Point2D(5.0, 11.01)
        );

        ApproxResult res = service.linear(points);
        assertNotNull(res);
        assertTrue(res.r2 >= 0.99, "R² должен быть близок к 1 для линейных данных с малым шумом");
        assertEquals("Высокая точность", res.r2Message);
        assertEquals("Линейная", res.name);
        assertNotNull(res.params);
        assertEquals(2, res.params.size());
    }
}